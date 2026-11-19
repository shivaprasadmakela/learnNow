import React, { useEffect, useState } from 'react';
import {
    Award,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    BookOpen,
    RotateCcw,
    ThumbsUp,
    ThumbsDown,
    ArrowRight
} from 'lucide-react';
import {
    fetchTopicInterview,
    rateInterview,
    interviewKindLabel,
    interviewTitle,
    type AnswerFeedback,
    type QuestionCategory,
    type TopicInterviewReport as ReportData
} from '../../api/interview.api';
import styles from './TopicInterview.module.css';

interface TopicInterviewReportProps {
    report: ReportData;
    onDone: () => void;
    /** "Study this lesson". `topicId` is passed when the report knows the question's topic. */
    onReviseLesson?: (subtopicId: string, topicId?: string | null) => void;
    /** "Retry this question": asks the one question again by voice. */
    onRetryQuestion?: (question: AnswerFeedback) => void;
}

const DIMENSIONS: { key: 'accuracy' | 'depth' | 'structure' | 'communication'; label: string; hint: string }[] = [
    { key: 'accuracy', label: 'Accuracy', hint: 'Were the facts right?' },
    { key: 'depth', label: 'Depth', hint: 'Did you go past the basics?' },
    { key: 'structure', label: 'Structure', hint: 'Did the answer have a clear order?' },
    { key: 'communication', label: 'Clarity', hint: 'Was the point easy to follow?' }
];

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
    intro: 'Intro',
    technical: 'Technical',
    project: 'Project',
    behavioural: 'Behavioural',
    hr: 'HR'
};

/** A retry asks the question again; its plan keeps the original id, else the prompt matches. */
const findOriginal = (parent: ReportData | null, q: AnswerFeedback) =>
    parent?.questions.find(p => (q.planQuestionId && p.planQuestionId === q.planQuestionId) || p.prompt === q.prompt) ?? null;

export const TopicInterviewReport: React.FC<TopicInterviewReportProps> = ({
    report,
    onDone,
    onReviseLesson,
    onRetryQuestion
}) => {
    const [openModelAnswers, setOpenModelAnswers] = useState<Record<string, boolean>>({});
    const [parent, setParent] = useState<ReportData | null>(null);

    // A retry's report shows the earlier score beside the new one.
    useEffect(() => {
        if (!report.parentInterviewId) return;
        let active = true;
        fetchTopicInterview(report.parentInterviewId)
            .then(p => active && setParent(p))
            .catch(() => {
                /* the report reads fine without the comparison */
            });
        return () => {
            active = false;
        };
    }, [report.parentInterviewId]);

    const toggleModel = (id: string) => {
        setOpenModelAnswers(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const habits = report.habits;
    const feedback = report.feedback ?? null;
    const isRetry = report.kind === 'RETRY';

    return (
        <div className={styles.reportBody} data-testid="topic-interview-report">
            <div className={styles.reportHero}>
                <div className={styles.reportHeroText}>
                    <span className={styles.pillBadge}>{interviewKindLabel(report.kind)}</span>
                    <h2 className={styles.reportTitle}>{interviewTitle(report)}</h2>
                    <p className={styles.reportLead}>
                        {report.pointsAwarded > 0
                            ? `Well done. You earned ${report.pointsAwarded} points for this interview.`
                            : isRetry
                              ? 'Practice round: no points, and it does not use your monthly interviews.'
                              : 'Interview done. Read through the notes below and try the weak spots again.'}
                    </p>
                    {report.pointsAwarded > 0 && (
                        <div className={styles.offerBadgeRow}>
                            <span className={styles.pointsBadge}>
                                <Award size={14} />+{report.pointsAwarded} Points Earned
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.scoreCircle}>
                    <span className={styles.scoreNum}>{report.overallScore ?? 0}</span>
                    <span className={styles.scoreOutOf}>Overall</span>
                </div>
            </div>

            {feedback && (
                <section aria-label="Overall feedback">
                    <h3 className={styles.reportSectionTitle}>How your answers did</h3>
                    <div className={styles.dimensions}>
                        {DIMENSIONS.map(d => {
                            const value = Math.max(0, Math.min(10, feedback.dimensions?.[d.key] ?? 0));
                            return (
                                <div key={d.key} className={styles.dimension}>
                                    <div className={styles.dimensionHead}>
                                        <span title={d.hint}>{d.label}</span>
                                        <span className={styles.dimensionValue}>{value}/10</span>
                                    </div>
                                    <div
                                        className={styles.dimensionBar}
                                        role="progressbar"
                                        aria-label={d.label}
                                        aria-valuenow={value}
                                        aria-valuemin={0}
                                        aria-valuemax={10}
                                    >
                                        <span style={{ width: `${value * 10}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.feedbackColumns}>
                        {feedback.strengths?.length > 0 && (
                            <div className={styles.feedbackList}>
                                <h4>What went well</h4>
                                <ul>
                                    {feedback.strengths.map(s => (
                                        <li key={s}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {feedback.improvements?.length > 0 && (
                            <div className={styles.feedbackList}>
                                <h4>What to work on</h4>
                                <ul>
                                    {feedback.improvements.map(s => (
                                        <li key={s}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    {feedback.next_step && (
                        <p className={styles.nextStep}>
                            <ArrowRight size={15} />
                            <span>
                                <strong>Next step:</strong> {feedback.next_step}
                            </span>
                        </p>
                    )}
                </section>
            )}

            {habits && (
                <section aria-label="Speaking habits">
                    <h3 className={styles.reportSectionTitle}>Speaking habits</h3>
                    <div className={styles.habitsGrid}>
                        <div className={styles.habitCard}>
                            <div className={styles.habitVal}>{habits.words_per_minute ?? 0}</div>
                            <div className={styles.habitLabel}>Words / Min</div>
                        </div>
                        <div className={styles.habitCard}>
                            <div className={styles.habitVal}>{habits.filler_words_count ?? 0}</div>
                            <div className={styles.habitLabel}>Filler Words</div>
                        </div>
                        <div className={styles.habitCard}>
                            <div className={styles.habitVal}>
                                {habits.longest_pause_seconds != null ? `${habits.longest_pause_seconds}s` : '0s'}
                            </div>
                            <div className={styles.habitLabel}>Longest Pause</div>
                        </div>
                        <div className={styles.habitCard}>
                            <div className={styles.habitVal}>{habits.average_words_per_answer ?? 0}</div>
                            <div className={styles.habitLabel}>Avg Answer Words</div>
                        </div>
                    </div>
                </section>
            )}

            <section aria-label="Questions">
                <h3 className={styles.reportSectionTitle}>Question by question ({report.questions.length})</h3>
                {report.questions.map((q, idx) => {
                    const qKey = q.planQuestionId || q.questionId || String(idx);
                    const isOpen = Boolean(openModelAnswers[qKey]);
                    const original = findOriginal(parent, q);
                    const lessonTopicId = q.topicId ?? report.topicId;

                    return (
                        <div key={qKey} className={styles.questionCard} data-testid={`feedback-q-${idx}`}>
                            <div className={styles.questionCardHeader}>
                                <div className={styles.questionHeadText}>
                                    {q.category && (
                                        <span className={styles.categoryChip}>{CATEGORY_LABELS[q.category] ?? q.category}</span>
                                    )}
                                    <h4 className={styles.questionPrompt}>
                                        {idx + 1}. {q.prompt}
                                    </h4>
                                </div>
                                <div className={styles.scoreStack}>
                                    <span className={styles.qScoreBadge}>{q.score != null ? `${q.score} / 10` : '—'}</span>
                                    {original?.score != null && (
                                        <span className={styles.beforeScore}>Before: {original.score} / 10</span>
                                    )}
                                </div>
                            </div>

                            {q.good && (
                                <div className={`${styles.feedbackBlock} ${styles.feedbackGood}`}>
                                    <CheckCircle2 size={15} />
                                    <span>
                                        <strong>Strong points:</strong> {q.good}
                                    </span>
                                </div>
                            )}

                            {q.missing && (
                                <div className={`${styles.feedbackBlock} ${styles.feedbackMissing}`}>
                                    <AlertCircle size={15} />
                                    <span>
                                        <strong>Points to include:</strong> {q.missing}
                                    </span>
                                </div>
                            )}

                            {q.evidence && (
                                <blockquote className={styles.evidence}>
                                    <span>You said:</span> “{q.evidence}”
                                </blockquote>
                            )}

                            {q.modelAnswer && (
                                <>
                                    <button type="button" className={styles.modelAnswerToggle} onClick={() => toggleModel(qKey)}>
                                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {isOpen ? 'Hide model answer' : 'View model answer'}
                                    </button>
                                    {isOpen && (
                                        <div className={styles.modelAnswerBox}>
                                            <p>{q.modelAnswer}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {((q.subtopicId && onReviseLesson) || (q.planQuestionId && onRetryQuestion)) && (
                                <div className={styles.questionActions}>
                                    {q.subtopicId && onReviseLesson && (
                                        <button type="button" className={styles.ghostBtn} onClick={() => onReviseLesson(q.subtopicId!, lessonTopicId)}>
                                            <BookOpen size={14} />
                                            Study this lesson
                                        </button>
                                    )}
                                    {q.planQuestionId && onRetryQuestion && (
                                        <button type="button" className={styles.ghostBtn} onClick={() => onRetryQuestion(q)}>
                                            <RotateCcw size={14} />
                                            Retry this question
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </section>

            <RatingBox interviewId={report.id} initial={report.learnerRating ?? null} />

            <div className={styles.reportFooter}>
                <button type="button" className={styles.startBtn} onClick={onDone}>
                    Done
                </button>
            </div>
        </div>
    );
};

/** "Was this evaluation fair?": a thumb saves at once; a comment is optional and sent after. */
const RatingBox: React.FC<{ interviewId: string; initial: 1 | -1 | null }> = ({ interviewId, initial }) => {
    const [rating, setRating] = useState<1 | -1 | null>(initial);
    const [comment, setComment] = useState('');
    const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'commented' | 'error'>('idle');

    const rate = async (value: 1 | -1) => {
        setRating(value);
        setState('saving');
        try {
            await rateInterview(interviewId, value);
            setState('saved');
        } catch {
            setState('error');
        }
    };

    const sendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating || !comment.trim()) return;
        setState('saving');
        try {
            await rateInterview(interviewId, rating, comment.trim());
            setState('commented');
        } catch {
            setState('error');
        }
    };

    return (
        <section className={styles.ratingBox} aria-label="Rate this evaluation">
            <div className={styles.ratingRow}>
                <span>Was this evaluation fair?</span>
                <div className={styles.ratingButtons}>
                    <button
                        type="button"
                        className={rating === 1 ? styles.thumbActive : styles.thumb}
                        aria-pressed={rating === 1}
                        aria-label="Yes, it was fair"
                        onClick={() => rate(1)}
                        disabled={state === 'saving'}
                    >
                        <ThumbsUp size={16} />
                    </button>
                    <button
                        type="button"
                        className={rating === -1 ? styles.thumbActive : styles.thumb}
                        aria-pressed={rating === -1}
                        aria-label="No, it was not fair"
                        onClick={() => rate(-1)}
                        disabled={state === 'saving'}
                    >
                        <ThumbsDown size={16} />
                    </button>
                </div>
            </div>
            {rating !== null && state !== 'commented' && (
                <form className={styles.ratingComment} onSubmit={sendComment}>
                    <textarea
                        value={comment}
                        maxLength={500}
                        rows={2}
                        placeholder={rating === -1 ? 'What did it get wrong? (optional)' : 'Anything to add? (optional)'}
                        onChange={e => setComment(e.target.value)}
                    />
                    <button type="submit" className={styles.ghostBtn} disabled={!comment.trim() || state === 'saving'}>
                        Send
                    </button>
                </form>
            )}
            {state === 'saved' && <p className={styles.ratingNote}>Thanks, your answer is saved.</p>}
            {state === 'commented' && <p className={styles.ratingNote}>Thanks for the note.</p>}
            {state === 'error' && <p className={styles.ratingError} role="alert">Could not save that. Please try again.</p>}
        </section>
    );
};
