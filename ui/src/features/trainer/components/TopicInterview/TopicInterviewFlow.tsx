import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, X, Clock, Volume2, CheckCircle, Sparkles, Captions } from 'lucide-react';
import { Room, RoomEvent, Track, type Participant, type RemoteTrack, type TranscriptionSegment } from 'livekit-client';
import {
    startTopicInterview,
    fetchTopicInterview,
    retryInterviewQuestion,
    interviewKindLabel,
    type AnswerFeedback,
    type InterviewKind,
    type StartInterviewResponse,
    type TopicInterviewReport as ReportData
} from '../../api/interview.api';
import { setInterviewActive } from '../../pageContext';
import { TopicInterviewReport } from './TopicInterviewReport';
import styles from './TopicInterview.module.css';

interface TopicInterviewFlowProps {
    isOpen: boolean;
    onClose: () => void;
    /** A topic interview: the topic to ask about. Used when `start` is not given. */
    topicId?: string;
    topicTitle?: string;
    /** The heading for a mock interview: the role. Falls back to `topicTitle`. */
    title?: string;
    kind?: InterviewKind;
    /** How long the interview is meant to take, for the start screen. */
    minutes?: number;
    /** Starts the interview and returns the room. Defaults to a topic interview for `topicId`. */
    start?: () => Promise<StartInterviewResponse>;
    /** Opens an interview that already happened, straight to its report. */
    reportId?: string;
    /** The report's "Study this lesson". `topicId` is set when the report knows it. */
    onReviseLesson?: (subtopicId: string, topicId?: string | null) => void;
}

type Stage = 'precheck' | 'starting' | 'call' | 'scoring' | 'report' | 'ended';

interface Session {
    kind: InterviewKind;
    title: string;
    minutes?: number;
    start: () => Promise<StartInterviewResponse>;
}

/** Remembers whether the learner wants captions; storage can be unavailable (private windows). */
const CAPTIONS_KEY = 'ln_interview_captions';
const readCaptionsSetting = () => {
    try {
        return localStorage.getItem(CAPTIONS_KEY) === '1';
    } catch {
        return false;
    }
};
const saveCaptionsSetting = (on: boolean) => {
    try {
        localStorage.setItem(CAPTIONS_KEY, on ? '1' : '0');
    } catch {
        /* the switch still works for this interview */
    }
};

/** Used when an older server does not say how long the call runs. */
const DEFAULT_SECONDS: Record<InterviewKind, number> = {
    TOPIC: 360,
    RETRY: 180,
    RESUME: 900,
    HR: 600,
    BEHAVIOURAL: 600,
    PROJECT: 600,
    FULL: 1500
};

/**
 * The agent ends the call itself, after its closing words. When the clock reaches zero the UI
 * only waits; it disconnects after this grace period in case the agent never does.
 */
const WRAP_UP_GRACE_MS = 90_000;

/** Scoring can take a couple of minutes after the call; stop polling after this. */
const SCORING_WAIT_MS = 3 * 60_000;

const isMock = (kind: InterviewKind) => kind !== 'TOPIC' && kind !== 'RETRY';

/**
 * A voice interview in an overlay: a topic interview, a mock interview or a retry of one question.
 * The stages are a mic check, the call, waiting for the score, and the report. A report can start
 * a retry, which runs through the same stages again.
 */
export const TopicInterviewFlow: React.FC<TopicInterviewFlowProps> = ({
    isOpen,
    onClose,
    topicId,
    topicTitle,
    title,
    kind = 'TOPIC',
    minutes,
    start,
    reportId,
    onReviseLesson
}) => {
    const initialSession = useCallback(
        (): Session => ({
            kind,
            title: title || topicTitle || interviewKindLabel(kind),
            minutes,
            start: start ?? (() => startTopicInterview(topicId ?? ''))
        }),
        [kind, title, topicTitle, minutes, start, topicId]
    );

    const [session, setSession] = useState<Session>(initialSession);
    const [stage, setStage] = useState<Stage>(reportId ? 'scoring' : 'precheck');
    const [error, setError] = useState<string | null>(null);
    const [scoringTimedOut, setScoringTimedOut] = useState(false);
    const [pollRound, setPollRound] = useState(0);
    const [micReady, setMicReady] = useState(false);
    const [micVolume, setMicVolume] = useState(0);
    const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
    const [userSpeaking, setUserSpeaking] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS[kind]);
    const [report, setReport] = useState<ReportData | null>(null);
    const [interviewId, setInterviewId] = useState<string | null>(reportId ?? null);
    const [captionsOn, setCaptionsOn] = useState(readCaptionsSetting);
    const [captions, setCaptions] = useState<{ interviewer: string; you: string }>({ interviewer: '', you: '' });

    const localStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const roomRef = useRef<Room | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Stops the mic check: its own stream would otherwise stay open beside LiveKit's. */
    const stopMicCheck = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
        analyserRef.current = null;
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
        }
        audioContextRef.current = null;
        setMicReady(false);
    };

    const cleanupMedia = () => {
        stopMicCheck();
        if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
    };

    // Closing resets everything, so opening again starts from the beginning.
    useEffect(() => {
        if (!isOpen) {
            setInterviewActive(false);
            cleanupMedia();
            setSession(initialSession());
            setStage(reportId ? 'scoring' : 'precheck');
            setInterviewId(reportId ?? null);
            setError(null);
            setReport(null);
            setScoringTimedOut(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => () => {
        setInterviewActive(false);
        cleanupMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mic check on the start screen.
    useEffect(() => {
        if (!isOpen || stage !== 'precheck') return;

        let active = true;
        navigator.mediaDevices
            ?.getUserMedia({ audio: true })
            .then(stream => {
                if (!active) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                setMicReady(true);
                try {
                    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 64;
                    ctx.createMediaStreamSource(stream).connect(analyser);
                    audioContextRef.current = ctx;
                    analyserRef.current = analyser;

                    const data = new Uint8Array(analyser.frequencyBinCount);
                    const updateMeter = () => {
                        if (!analyserRef.current) return;
                        analyserRef.current.getByteFrequencyData(data);
                        let sum = 0;
                        for (let i = 0; i < data.length; i++) sum += data[i];
                        setMicVolume(Math.min(100, Math.round((sum / data.length / 128) * 100)));
                        animFrameRef.current = requestAnimationFrame(updateMeter);
                    };
                    updateMeter();
                } catch {
                    // No meter without AudioContext; the mic itself still works.
                }
            })
            .catch(() => {
                if (active) {
                    setError('Voice practice needs your microphone. Allow it in your browser, then try again.');
                }
            });

        return () => {
            active = false;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isOpen, stage]);

    const handleEndCall = useCallback(() => {
        if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        setInterviewActive(false);
        setStage(current => (current === 'call' ? 'scoring' : current));
    }, []);

    // The countdown. At zero the agent is asked to wrap up by its own clock; the UI waits for it.
    useEffect(() => {
        if (stage !== 'call') return;
        const interval = setInterval(() => {
            setSecondsLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [stage]);

    const wrappingUp = stage === 'call' && secondsLeft === 0;
    useEffect(() => {
        if (!wrappingUp || graceTimerRef.current) return;
        graceTimerRef.current = setTimeout(handleEndCall, WRAP_UP_GRACE_MS);
    }, [wrappingUp, handleEndCall]);

    const handleStartCall = async () => {
        setError(null);
        setStage('starting');
        let started: StartInterviewResponse;
        try {
            started = await session.start();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Could not start the interview. Please try again.');
            setStage('precheck');
            return;
        }

        stopMicCheck();
        setInterviewId(started.interviewId);
        setSecondsLeft(started.maxSeconds && started.maxSeconds > 0 ? started.maxSeconds : DEFAULT_SECONDS[session.kind]);
        setCaptions({ interviewer: '', you: '' });
        setInterviewActive(true);
        setStage('call');

        try {
            const room = new Room({ adaptiveStream: true, dynacast: true });
            roomRef.current = room;

            room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
                if (track.kind === Track.Kind.Audio && audioElementRef.current) {
                    track.attach(audioElementRef.current);
                }
            });

            room.on(RoomEvent.ActiveSpeakersChanged, speakers => {
                const local = room.localParticipant;
                setUserSpeaking(speakers.some(s => s.identity === local.identity));
                setInterviewerSpeaking(speakers.some(s => s.identity !== local.identity));
            });

            // The latest line each side said, for captions. Only shown when the learner turned them on.
            room.on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[], participant?: Participant) => {
                const text = segments[segments.length - 1]?.text?.trim();
                if (!text) return;
                const isYou = participant?.identity === room.localParticipant.identity;
                setCaptions(current => (isYou ? { ...current, you: text } : { ...current, interviewer: text }));
            });

            room.on(RoomEvent.Disconnected, () => {
                roomRef.current = null;
                if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
                graceTimerRef.current = null;
                setInterviewActive(false);
                setStage(current => (current === 'call' ? 'scoring' : current));
            });

            await room.connect(started.url, started.token);
            await room.localParticipant.setMicrophoneEnabled(true);
        } catch {
            // The interview row exists; whatever was said is still scored, so wait for the report.
            setError('The connection was lost, so the interview ended.');
            handleEndCall();
        }
    };

    // Waits for the score with backoff. Scoring can take a couple of minutes after the call.
    useEffect(() => {
        if (stage !== 'scoring' || !interviewId) return;

        let active = true;
        let timer: ReturnType<typeof setTimeout>;
        const deadline = Date.now() + SCORING_WAIT_MS;
        let delay = 2000;

        const poll = async () => {
            try {
                const rep = await fetchTopicInterview(interviewId);
                if (!active) return;
                if (rep.status === 'SCORED') {
                    setReport(rep);
                    setStage('report');
                    return;
                }
                if (rep.status === 'FAILED') {
                    setError('We could not score this interview. It does not count towards your monthly limit.');
                    setStage('ended');
                    return;
                }
                if (rep.status === 'ABANDONED') {
                    setError('The call ended before any answers were saved, so there is no report for this interview.');
                    setStage('ended');
                    return;
                }
            } catch {
                // A failed poll is retried with the next one.
            }
            if (!active) return;
            if (Date.now() < deadline) {
                timer = setTimeout(poll, delay);
                delay = Math.min(delay * 1.5, 10_000);
            } else {
                setScoringTimedOut(true);
            }
        };

        timer = setTimeout(poll, reportId && interviewId === reportId ? 0 : 1500);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [stage, interviewId, pollRound, reportId]);

    const startRetry = (parent: ReportData, question: AnswerFeedback) => {
        if (!question.planQuestionId) return;
        const planQuestionId = question.planQuestionId;
        setSession({
            kind: 'RETRY',
            title: question.prompt,
            minutes: 3,
            start: () => retryInterviewQuestion(parent.id, planQuestionId)
        });
        setReport(null);
        setInterviewId(null);
        setError(null);
        setScoringTimedOut(false);
        setStage('precheck');
    };

    const toggleCaptions = (on: boolean) => {
        setCaptionsOn(on);
        saveCaptionsSetting(on);
    };

    if (!isOpen) return null;

    const formatTimer = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const mock = isMock(session.kind);
    const aboutMinutes = session.minutes ?? Math.round(DEFAULT_SECONDS[session.kind] / 60);
    const instructions =
        session.kind === 'RETRY'
            ? [
                  'You get the same question again. Answer it the way you would now.',
                  `About ${aboutMinutes} minutes. Practice only: it does not use your monthly interviews or earn points.`,
                  'Feedback is about what you say, not how you sound.'
              ]
            : mock
              ? [
                    `A ${interviewKindLabel(session.kind).toLowerCase()}, with questions and follow-ups like a real round.`,
                    `About ${aboutMinutes} minutes. Answer out loud in English; the interviewer closes the call at the end.`,
                    'Feedback is about what you say, not how you sound. You can end it any time.'
                ]
              : [
                    'Three questions on this topic, each with follow-ups.',
                    'Answer out loud in English. One or two minutes per question is plenty.',
                    `About ${aboutMinutes} minutes. Feedback is about what you say, not how you sound.`
                ];

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={session.title}>
            <audio ref={audioElementRef} autoPlay playsInline style={{ display: 'none' }} />

            <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderLeft}>
                        <h2 className={styles.modalTitle}>{session.title}</h2>
                        <span className={styles.pillBadge}>
                            <Sparkles size={13} />
                            {session.kind === 'TOPIC' ? 'Voice practice' : interviewKindLabel(session.kind)}
                        </span>
                    </div>

                    <div className={styles.modalHeaderRight}>
                        {stage === 'call' && (
                            <div className={`${styles.timerBadge} ${secondsLeft < 60 ? styles.timerWarning : ''}`}>
                                <Clock size={14} />
                                <span>{formatTimer(secondsLeft)}</span>
                            </div>
                        )}
                        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className={styles.errorWrap}>
                        <div className={styles.errorBanner} role="alert">{error}</div>
                    </div>
                )}

                {stage === 'precheck' && (
                    <div className={styles.preCheckBody}>
                        <div className={styles.instructionsBox}>
                            {instructions.map(line => (
                                <div key={line} className={styles.instructionItem}>
                                    <CheckCircle size={18} className={styles.instructionIcon} />
                                    <span>{line}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.micTestCard}>
                            <div className={styles.micTestHead}>
                                <span className={styles.micTestTitle}>
                                    <Volume2 size={16} />
                                    Microphone check
                                </span>
                                <span className={micVolume > 10 ? styles.micOk : styles.micIdle}>
                                    {micVolume > 10 ? 'Your mic is working' : 'Say something to test it'}
                                </span>
                            </div>
                            <div className={styles.micMeterBar}>
                                <div className={styles.micMeterFill} style={{ width: `${micVolume}%` }} />
                            </div>
                        </div>

                        <label className={styles.captionsToggle}>
                            <input type="checkbox" checked={captionsOn} onChange={e => toggleCaptions(e.target.checked)} />
                            <Captions size={16} />
                            <span>
                                Show captions
                                <small>The last thing each of you said, as text. Off by default.</small>
                            </span>
                        </label>

                        <div className={styles.preCheckActions}>
                            <button
                                type="button"
                                className={styles.startBtn}
                                onClick={handleStartCall}
                                disabled={Boolean(error && !micReady)}
                            >
                                <Mic size={16} />
                                {session.kind === 'RETRY' ? 'Start retry' : 'Start interview'}
                            </button>
                        </div>
                    </div>
                )}

                {stage === 'starting' && (
                    <div className={styles.scoringWaitBody} role="status">
                        <div className={styles.spinner} />
                        <div>
                            <h3 className={styles.waitTitle}>{mock ? 'Writing your interview…' : 'Connecting…'}</h3>
                            <p className={styles.waitText}>
                                {mock
                                    ? 'Your interviewer is preparing questions for you. This can take up to half a minute.'
                                    : 'Getting your interviewer ready.'}
                            </p>
                        </div>
                    </div>
                )}

                {stage === 'call' && (
                    <div className={styles.callBody}>
                        <div className={styles.visualizerOrbContainer}>
                            <div className={`${styles.orbPulsingRing} ${userSpeaking ? styles.orbUserSpeaking : ''}`} />
                            <div className={`${styles.visualizerOrb} ${interviewerSpeaking || userSpeaking ? styles.visualizerOrbActive : ''}`}>
                                <Mic size={42} />
                            </div>
                        </div>

                        <div className={styles.speakingStatusPill} role="status">
                            <span className={styles.statusDot} />
                            {wrappingUp
                                ? 'Wrapping up…'
                                : interviewerSpeaking
                                  ? 'Interviewer is speaking…'
                                  : userSpeaking
                                    ? 'Listening to you…'
                                    : 'In the call. Speak when ready.'}
                        </div>

                        {captionsOn && (
                            <div className={styles.captions} aria-live="polite">
                                <p>
                                    <strong>Interviewer:</strong> {captions.interviewer || '…'}
                                </p>
                                <p>
                                    <strong>You:</strong> {captions.you || '…'}
                                </p>
                            </div>
                        )}

                        <button type="button" className={styles.endCallBtn} onClick={handleEndCall}>
                            End interview
                        </button>
                    </div>
                )}

                {stage === 'scoring' && (
                    <div className={styles.scoringWaitBody} role="status">
                        <div className={styles.spinner} />
                        <div>
                            <h3 className={styles.waitTitle}>Scoring your interview</h3>
                            <p className={styles.waitText}>
                                {scoringTimedOut
                                    ? 'This is taking longer than usual. Your report will also appear in your interview history.'
                                    : 'Checking your answers against the key points. This usually takes a minute or two.'}
                            </p>
                        </div>
                        {scoringTimedOut && (
                            <button
                                type="button"
                                className={styles.startBtn}
                                onClick={() => {
                                    setScoringTimedOut(false);
                                    setPollRound(round => round + 1);
                                }}
                            >
                                Check again
                            </button>
                        )}
                    </div>
                )}

                {stage === 'ended' && (
                    <div className={styles.scoringWaitBody}>
                        <button type="button" className={styles.startBtn} onClick={onClose}>
                            Close
                        </button>
                    </div>
                )}

                {stage === 'report' && report && (
                    <TopicInterviewReport
                        report={report}
                        onDone={onClose}
                        onReviseLesson={onReviseLesson}
                        onRetryQuestion={q => startRetry(report, q)}
                    />
                )}
            </div>
        </div>
    );
};

export default TopicInterviewFlow;
