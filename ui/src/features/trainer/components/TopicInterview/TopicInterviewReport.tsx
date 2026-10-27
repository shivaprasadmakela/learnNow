import React, { useState } from 'react';
import { Award, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { type TopicInterviewReport as ReportData } from '../../api/interview.api';
import styles from './TopicInterview.module.css';

interface TopicInterviewReportProps {
    report: ReportData;
    onDone: () => void;
    onReviseLesson?: (subtopicId: string) => void;
}

export const TopicInterviewReport: React.FC<TopicInterviewReportProps> = ({
    report,
    onDone,
    onReviseLesson
}) => {
    const [openModelAnswers, setOpenModelAnswers] = useState<Record<string, boolean>>({});

    const toggleModel = (id: string) => {
        setOpenModelAnswers(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const habits = report.habits;

    return (
        <div className={styles.reportBody} data-testid="topic-interview-report">
            {/* Hero Banner: Overall Score & Points */}
            <div className={styles.reportHero}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.4rem' }}>
                        Interview Feedback: {report.topicTitle}
                    </h2>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                        {report.pointsAwarded > 0
                            ? `Congratulations! You earned ${report.pointsAwarded} points for completing this interview.`
                            : 'Practice completed. Keep reviewing and sharpening your spoken explanations.'}
                    </p>
                    <div className={styles.offerBadgeRow}>
                        <span className={styles.pointsBadge}>
                            <Award size={14} />
                            +{report.pointsAwarded} Points Earned
                        </span>
                    </div>
                </div>

                <div className={styles.scoreCircle}>
                    <span className={styles.scoreNum}>{report.overallScore ?? 0}</span>
                    <span className={styles.scoreOutOf}>Overall</span>
                </div>
            </div>

            {/* Speaking Habits */}
            {habits && (
                <div>
                    <h3 style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                        Speaking Habits
                    </h3>
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
                </div>
            )}

            {/* Questions Feedback */}
            <div>
                <h3 style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                    Question Breakdown ({report.questions.length})
                </h3>
                {report.questions.map((q, idx) => {
                    const qKey = q.questionId || String(idx);
                    const isOpen = Boolean(openModelAnswers[qKey]);

                    return (
                        <div key={qKey} className={styles.questionCard} data-testid={`feedback-q-${idx}`}>
                            <div className={styles.questionCardHeader}>
                                <h4 className={styles.questionPrompt}>
                                    {idx + 1}. {q.prompt}
                                </h4>
                                <span className={styles.qScoreBadge}>
                                    {q.score != null ? `${q.score} / 10` : '—'}
                                </span>
                            </div>

                            {q.good && (
                                <div className={`${styles.feedbackBlock} ${styles.feedbackGood}`}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                        <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>
                                            <strong>Strong points:</strong> {q.good}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {q.missing && (
                                <div className={`${styles.feedbackBlock} ${styles.feedbackMissing}`}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>
                                            <strong>Points to include:</strong> {q.missing}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {q.evidence && (
                                <div className={styles.feedbackBlock} style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                    <em>Learner stated: "{q.evidence}"</em>
                                </div>
                            )}

                            {q.modelAnswer && (
                                <>
                                    <button
                                        type="button"
                                        className={styles.modelAnswerToggle}
                                        onClick={() => toggleModel(qKey)}
                                    >
                                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {isOpen ? 'Hide model answer' : 'View model answer'}
                                    </button>
                                    {isOpen && (
                                        <div className={styles.modelAnswerBox}>
                                            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{q.modelAnswer}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {q.subtopicId && onReviseLesson && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <button
                                        type="button"
                                        className={styles.pillBadge}
                                        onClick={() => onReviseLesson(q.subtopicId!)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <BookOpen size={12} />
                                        Revise lesson
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                    type="button"
                    className={styles.startBtn}
                    onClick={onDone}
                    style={{ minWidth: '120px', justifyContent: 'center' }}
                >
                    Done
                </button>
            </div>
        </div>
    );
};
