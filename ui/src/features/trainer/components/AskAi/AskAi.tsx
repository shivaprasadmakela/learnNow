import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Send, Sparkles, Square, Trash2, X } from 'lucide-react';
import { Markdown } from '../../../../shared/components/ui/Markdown';
import {
    deleteNote,
    fetchTrainer,
    saveGoal,
    streamChat,
    transcribe,
    type ChatTurn,
    type TrainerGoal,
    type TrainerProfile
} from '../../api/trainer.api';
import { getTrainerContext, useInterviewActive } from '../../pageContext';
import { toWav16k } from '../../utils/wav';
import styles from './AskAi.module.css';

/** Sarvam's synchronous speech-to-text takes up to 30 seconds; stop a little before. */
const MAX_RECORDING_MS = 28_000;

const STARTERS = ['Explain this lesson more simply', 'What should I learn next?', 'Am I ready for interviews?'];

/**
 * Ask AI: the learner's personal trainer, a floating button that opens a chat panel.
 *
 * It knows the page the learner is on (see pageContext) and, on the server, their progress, goal
 * and the trainer's earlier notes. The conversation is kept only in this component; closing the
 * panel keeps it, reloading the page starts afresh.
 */
export const AskAi: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState<TrainerProfile | null>(null);
    const [messages, setMessages] = useState<ChatTurn[]>([]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [view, setView] = useState<'chat' | 'about'>('chat');
    const recorderRef = useRef<MediaRecorder | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const interviewActive = useInterviewActive();

    const loadProfile = useCallback(() => {
        fetchTrainer().then(setProfile).catch(() => setProfile(null));
    }, []);

    useEffect(loadProfile, [loadProfile]);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [messages]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const send = async (text: string) => {
        const content = text.trim();
        if (!content || busy) return;
        const history: ChatTurn[] = [...messages, { role: 'user', content }];
        setMessages([...history, { role: 'assistant', content: '' }]);
        setDraft('');
        setError(null);
        setBusy(true);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const { page, quizInProgress } = getTrainerContext();
            await streamChat(
                { messages: history, page, quizInProgress },
                piece =>
                    setMessages(current => {
                        const next = [...current];
                        const last = next[next.length - 1];
                        next[next.length - 1] = { ...last, content: last.content + piece };
                        return next;
                    }),
                controller.signal
            );
            // A new note may have been written; refresh what "About you" shows.
            loadProfile();
        } catch (e) {
            if (controller.signal.aborted) return;
            setError(e instanceof Error ? e.message : 'The AI trainer could not answer right now.');
            // Drop the empty reply bubble, keep the learner's message so they can retry.
            setMessages(current => (current[current.length - 1]?.content ? current : current.slice(0, -1)));
        } finally {
            setBusy(false);
        }
    };

    const startRecording = async () => {
        setError(null);
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        } catch {
            setError('Microphone access was blocked. Allow it in your browser to speak your question.');
            return;
        }
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            setRecording(false);
            setTranscribing(true);
            try {
                const text = await transcribe(await toWav16k(new Blob(chunks)));
                if (text) setDraft(d => (d ? `${d} ${text}` : text));
                else setError("I couldn't hear anything. Try again a little closer to the mic.");
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not turn your recording into text.');
            } finally {
                setTranscribing(false);
            }
        };
        recorderRef.current = recorder;
        recorder.start();
        setRecording(true);
        window.setTimeout(() => recorder.state === 'recording' && recorder.stop(), MAX_RECORDING_MS);
    };

    const stopRecording = () => recorderRef.current?.state === 'recording' && recorderRef.current.stop();

    if (!profile?.available) return null;

    return (
        <>
            {!open && (
                <button type="button" className={styles.fab} onClick={() => setOpen(true)} aria-label="Ask AI">
                    <Sparkles size={18} aria-hidden />
                    <span>Ask AI</span>
                </button>
            )}
            {open && (
                <section className={styles.panel} aria-label="Ask AI trainer">
                    <header className={styles.header}>
                        <div className={styles.tabs} role="tablist">
                            <button role="tab" aria-selected={view === 'chat'} className={view === 'chat' ? styles.tabActive : styles.tab} onClick={() => setView('chat')}>
                                Ask AI
                            </button>
                            <button role="tab" aria-selected={view === 'about'} className={view === 'about' ? styles.tabActive : styles.tab} onClick={() => setView('about')}>
                                About you
                            </button>
                        </div>
                        <button type="button" className={styles.iconButton} onClick={() => setOpen(false)} aria-label="Close Ask AI">
                            <X size={18} />
                        </button>
                    </header>

                    {view === 'about' ? (
                        <AboutYou profile={profile} onChanged={loadProfile} />
                    ) : (
                        <>
                            <div className={styles.messages} ref={listRef}>
                                {messages.length === 0 && (
                                    <div className={styles.empty}>
                                        <p>Your personal trainer. Ask about this lesson, what to learn next, or how to prepare for interviews.</p>
                                        {!profile.personalised && (
                                            <p className={styles.muted}>Personalisation is off in your privacy settings, so answers won't use your progress.</p>
                                        )}
                                        <div className={styles.starters}>
                                            {STARTERS.map(s => (
                                                <button key={s} type="button" className={styles.starter} onClick={() => send(s)}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {messages.map((m, i) => (
                                    <div key={i} className={m.role === 'user' ? styles.user : styles.assistant}>
                                        {m.role === 'assistant' ? (
                                            m.content ? <Markdown content={m.content} runnableCode={false} /> : <span className={styles.typing}>Thinking…</span>
                                        ) : (
                                            m.content
                                        )}
                                    </div>
                                ))}
                            </div>
                            {error && <p className={styles.error} role="alert">{error}</p>}
                            <form
                                className={styles.composer}
                                onSubmit={e => {
                                    e.preventDefault();
                                    void send(draft);
                                }}
                            >
                                <textarea
                                    className={styles.input}
                                    value={draft}
                                    placeholder={transcribing ? 'Turning your voice into text…' : recording ? 'Listening… tap stop when done' : 'Ask anything about your learning'}
                                    rows={2}
                                    maxLength={4000}
                                    disabled={transcribing}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            void send(draft);
                                        }
                                    }}
                                />
                                {!interviewActive && (
                                    <button
                                        type="button"
                                        className={recording ? styles.micActive : styles.iconButton}
                                        onClick={recording ? stopRecording : startRecording}
                                        disabled={transcribing || busy}
                                        aria-label={recording ? 'Stop recording' : 'Speak your question'}
                                    >
                                        {recording ? <Square size={16} /> : <Mic size={18} />}
                                    </button>
                                )}
                                <button type="submit" className={styles.sendButton} disabled={busy || !draft.trim()} aria-label="Send">
                                    <Send size={16} />
                                </button>
                            </form>
                        </>
                    )}
                </section>
            )}
        </>
    );
};

/** What the trainer holds about the learner: their goal, editable, and its notes, deletable. */
const AboutYou: React.FC<{ profile: TrainerProfile; onChanged: () => void }> = ({ profile, onChanged }) => {
    const [goal, setGoal] = useState<TrainerGoal>(profile.goal ?? {});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saveGoal({
                targetRole: goal.targetRole || null,
                targetDate: goal.targetDate || null,
                hoursPerWeek: goal.hoursPerWeek || null
            });
            setSaved(true);
            onChanged();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.about}>
            <form className={styles.goal} onSubmit={submit}>
                <h3>Your goal</h3>
                <label>
                    Target role
                    <input value={goal.targetRole ?? ''} maxLength={120} placeholder="e.g. Java backend developer" onChange={e => { setGoal({ ...goal, targetRole: e.target.value }); setSaved(false); }} />
                </label>
                <div className={styles.goalRow}>
                    <label>
                        Target date
                        <input type="date" value={goal.targetDate ?? ''} onChange={e => { setGoal({ ...goal, targetDate: e.target.value }); setSaved(false); }} />
                    </label>
                    <label>
                        Hours a week
                        <input type="number" min={1} max={80} value={goal.hoursPerWeek ?? ''} onChange={e => { setGoal({ ...goal, hoursPerWeek: e.target.value ? Number(e.target.value) : null }); setSaved(false); }} />
                    </label>
                </div>
                <button type="submit" className={styles.saveButton} disabled={saving}>
                    {saved ? 'Saved' : saving ? 'Saving…' : 'Save goal'}
                </button>
            </form>
            <h3>What your trainer has noted</h3>
            {profile.notes.length === 0 ? (
                <p className={styles.muted}>Nothing yet. Notes appear as you talk to your trainer, and you can delete any of them.</p>
            ) : (
                <ul className={styles.notes}>
                    {profile.notes.map(n => (
                        <li key={n.id}>
                            <span className={styles.noteKind}>{n.kind}</span>
                            <span className={styles.noteText}>{n.text}</span>
                            <button type="button" className={styles.iconButton} aria-label="Delete note" onClick={() => deleteNote(n.id).then(onChanged)}>
                                <Trash2 size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <p className={styles.muted}>Your trainer also reads your progress, quiz results, streak and study times. Turn this off any time with Personalisation in Privacy settings.</p>
        </div>
    );
};
