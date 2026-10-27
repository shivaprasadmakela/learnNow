import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Clock, Volume2, CheckCircle, Sparkles } from 'lucide-react';
import { Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client';
import {
    startTopicInterview,
    fetchTopicInterview,
    type TopicInterviewReport as ReportData
} from '../../api/interview.api';
import { setInterviewActive } from '../../pageContext';
import { TopicInterviewReport } from './TopicInterviewReport';
import styles from './TopicInterview.module.css';

interface TopicInterviewFlowProps {
    topicId: string;
    topicTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onReviseLesson?: (subtopicId: string) => void;
}

type Stage = 'precheck' | 'call' | 'scoring' | 'report';

export const TopicInterviewFlow: React.FC<TopicInterviewFlowProps> = ({
    topicId,
    topicTitle,
    isOpen,
    onClose,
    onReviseLesson
}) => {
    const [stage, setStage] = useState<Stage>('precheck');
    const [error, setError] = useState<string | null>(null);
    const [scoringTimedOut, setScoringTimedOut] = useState(false);
    const [pollRound, setPollRound] = useState(0);
    const [micReady, setMicReady] = useState(false);
    const [micVolume, setMicVolume] = useState(0);
    const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
    const [userSpeaking, setUserSpeaking] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(360);
    const [report, setReport] = useState<ReportData | null>(null);
    const [interviewId, setInterviewId] = useState<string | null>(null);

    // Audio & LiveKit refs
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const roomRef = useRef<Room | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup when closing
    useEffect(() => {
        if (!isOpen) {
            setInterviewActive(false);
            cleanupMedia();
            setStage('precheck');
            setError(null);
            setReport(null);
            setSecondsLeft(360);
        }
    }, [isOpen]);

    const cleanupMedia = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setMicReady(false);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
    };

    // Precheck: Start mic test on mount
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
                    const source = ctx.createMediaStreamSource(stream);
                    source.connect(analyser);

                    audioContextRef.current = ctx;
                    analyserRef.current = analyser;

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    const updateMeter = () => {
                        if (!analyserRef.current) return;
                        analyserRef.current.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                        const avg = sum / dataArray.length;
                        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                        animFrameRef.current = requestAnimationFrame(updateMeter);
                    };
                    updateMeter();
                } catch {
                    // AudioContext fallback
                }
            })
            .catch(() => {
                if (active) {
                    setError('Microphone access is required for voice practice. Please allow microphone permissions in your browser.');
                }
            });

        return () => {
            active = false;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isOpen, stage]);

    // Timer countdown in 'call' stage
    useEffect(() => {
        if (stage !== 'call') return;
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleEndCall();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [stage]);

    const handleStartCall = async () => {
        setError(null);
        try {
            // 1. Request room credentials from backend
            const { interviewId: id, url, token } = await startTopicInterview(topicId);
            setInterviewId(id);
            setInterviewActive(true);
            setStage('call');

            // 2. Connect LiveKit room
            const room = new Room({
                adaptiveStream: true,
                dynacast: true
            });
            roomRef.current = room;

            // Handle remote track subscription (agent audio)
            room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
                if (track.kind === Track.Kind.Audio && audioElementRef.current) {
                    track.attach(audioElementRef.current);
                }
            });

            // Handle speaker active detection
            room.on(RoomEvent.ActiveSpeakersChanged, speakers => {
                const local = room.localParticipant;
                let interviewerActive = false;
                let userActive = false;

                for (const speaker of speakers) {
                    if (speaker.identity === local.identity) {
                        userActive = true;
                    } else {
                        interviewerActive = true;
                    }
                }
                setInterviewerSpeaking(interviewerActive);
                setUserSpeaking(userActive);
            });

            room.on(RoomEvent.Disconnected, () => {
                handleCallDisconnected();
            });

            await room.connect(url, token);
            await room.localParticipant.setMicrophoneEnabled(true);
        } catch (err: unknown) {
            setInterviewActive(false);
            const msg = err instanceof Error ? err.message : 'Could not start voice session. Please try again.';
            setError(msg);
            setStage('precheck');
        }
    };

    const handleCallDisconnected = () => {
        setInterviewActive(false);
        setStage('scoring');
    };

    const handleEndCall = () => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        setInterviewActive(false);
        setStage('scoring');
    };

    // Polling for scoring completion in 'scoring' stage. The room closing, the transcript
    // callback and scoring (up to 90 s on the AI side) can take a few minutes, so back off
    // and keep going for 4 minutes before offering a manual retry.
    useEffect(() => {
        if (stage !== 'scoring' || !interviewId) return;

        let active = true;
        let timer: ReturnType<typeof setTimeout>;
        const deadline = Date.now() + 4 * 60_000;
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
                    setError('Interview scoring failed. Your monthly quota has been refunded.');
                    return;
                }
                if (rep.status === 'ABANDONED') {
                    setError('The call ended before your answers were saved, so there is no report for this interview.');
                    return;
                }
            } catch {
                // Keep polling
            }
            if (!active) return;
            if (Date.now() < deadline) {
                timer = setTimeout(poll, delay);
                delay = Math.min(delay * 1.5, 10_000);
            } else {
                setScoringTimedOut(true);
            }
        };

        timer = setTimeout(poll, 1500);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [stage, interviewId, pollRound]);

    if (!isOpen) return null;

    const formatTimer = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            {/* Hidden audio element to play agent speech */}
            <audio ref={audioElementRef} autoPlay playsInline style={{ display: 'none' }} />

            <div className={styles.modalWindow}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerTitleGroup}>
                        <h2 className={styles.topicHeading}>{topicTitle}</h2>
                        <span className={styles.pillBadge}>
                            <Sparkles size={13} />
                            Voice Practice
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {stage === 'call' && (
                            <div className={`${styles.timerPill} ${secondsLeft < 60 ? styles.timerWarning : ''}`}>
                                <Clock size={14} />
                                <span>{formatTimer(secondsLeft)}</span>
                            </div>
                        )}
                        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Error Banner if any */}
                {error && (
                    <div style={{ padding: '1rem 1.75rem 0' }}>
                        <div className={styles.errorBanner}>{error}</div>
                    </div>
                )}

                {/* Stage 1: Pre-Check */}
                {stage === 'precheck' && (
                    <div className={styles.preCheckBody}>
                        <div className={styles.instructionsBox}>
                            <div className={styles.instructionItem}>
                                <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
                                <span>The AI interviewer will ask 3 core questions with real-world follow-ups.</span>
                            </div>
                            <div className={styles.instructionItem}>
                                <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
                                <span>Answer out loud naturally in English, aiming for 1–2 minutes per question.</span>
                            </div>
                            <div className={styles.instructionItem}>
                                <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
                                <span>Max duration is 6 minutes. You can conclude anytime by clicking "End Interview".</span>
                            </div>
                        </div>

                        <div className={styles.micTestCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Volume2 size={16} color="#818cf8" />
                                    Microphone Test
                                </span>
                                <span style={{ fontSize: '0.75rem', color: micVolume > 10 ? '#34d399' : '#94a3b8' }}>
                                    {micVolume > 10 ? 'Microphone active' : 'Speak to test mic…'}
                                </span>
                            </div>
                            <div className={styles.micMeterBar}>
                                <div className={styles.micMeterFill} style={{ width: `${micVolume}%` }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className={styles.startBtn}
                                onClick={handleStartCall}
                                disabled={Boolean(error && !micReady)}
                            >
                                <Mic size={16} />
                                Start Interview
                            </button>
                        </div>
                    </div>
                )}

                {/* Stage 2: Call In Progress */}
                {stage === 'call' && (
                    <div className={styles.callBody}>
                        <div className={styles.visualizerOrbContainer}>
                            <div
                                className={`${styles.orbPulsingRing} ${userSpeaking ? styles.orbUserSpeaking : ''}`}
                            />
                            <div
                                className={`${styles.visualizerOrb} ${interviewerSpeaking || userSpeaking ? styles.visualizerOrbActive : ''}`}
                            >
                                <Mic size={42} />
                            </div>
                        </div>

                        <div className={styles.speakingStatusPill}>
                            <span className={styles.statusDot} />
                            {interviewerSpeaking
                                ? 'Interviewer is speaking…'
                                : userSpeaking
                                  ? 'Listening to you…'
                                  : 'In call · Speak when ready'}
                        </div>

                        <button type="button" className={styles.endCallBtn} onClick={handleEndCall}>
                            End Interview
                        </button>
                    </div>
                )}

                {/* Stage 3: Scoring Wait */}
                {stage === 'scoring' && (
                    <div className={styles.scoringWaitBody}>
                        <div className={styles.spinner} />
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.25rem' }}>
                                Scoring Your Interview
                            </h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                                {scoringTimedOut
                                    ? 'Scoring is taking longer than usual. Your report is still being prepared.'
                                    : 'Analyzing your answers against key expected points and evaluating speaking pace…'}
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

                {/* Stage 4: Feedback Report */}
                {stage === 'report' && report && (
                    <TopicInterviewReport
                        report={report}
                        onDone={onClose}
                        onReviseLesson={onReviseLesson}
                    />
                )}
            </div>
        </div>
    );
};

export default TopicInterviewFlow;
