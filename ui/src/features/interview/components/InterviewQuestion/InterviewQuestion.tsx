import React, { useId, useState } from 'react';
import { ArrowRight, Building2, ChevronDown, Eye, Lightbulb, MessageCircleQuestion, UserRound } from 'lucide-react';
import { countQuestions, type InterviewQuestion, type InterviewSighting } from '../../api/interview.api';
import { BeginnerAnswer } from './BeginnerAnswer';
import styles from '../../styles/Interview.module.css';

const paragraphs = (text: string) =>
    text
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(Boolean)
        .map((p, i) => <p key={i}>{p}</p>);

const formatMonth = (iso?: string | null): string | null => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    // UTC, or the first of the month becomes the last day of the previous one west of Greenwich.
    return date.toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

const describeSighting = (s: InterviewSighting): string =>
    [s.company, s.role, s.level, s.round, formatMonth(s.seenMonth)].filter(Boolean).join(' · ');

/**
 * Shown only when someone has actually reported being asked the question. A question nobody has
 * reported gets no badge at all - an earlier "Practice" label explained nothing to the people
 * reading it, and saying nothing claims nothing.
 */
const ReportedBadge: React.FC<{ sightings: InterviewSighting[] }> = ({ sightings }) => {
    if (sightings.length === 0) return null;
    const [first, ...rest] = sightings;
    const month = formatMonth(first.seenMonth);
    return (
        <span className={styles.reportedBadge} title={sightings.map(describeSighting).join('\n')}>
            <Building2 size={12} aria-hidden="true" />
            Asked at {first.company}
            {month ? ` · ${month}` : ''}
            {rest.length > 0 ? ` +${rest.length} more` : ''}
        </span>
    );
};

/**
 * One exchange: the interviewer asks, you try it, then reveal a strong answer. Once the answer is
 * out, the interviewer's next question appears beneath it - in a real round the follow-up is earned
 * by the answer before it, so it stays hidden until then.
 */
const Exchange: React.FC<{ question: InterviewQuestion }> = ({ question }) => {
    const [revealed, setRevealed] = useState(false);
    const [deepOpen, setDeepOpen] = useState(false);
    const answerId = useId();
    const deepId = useId();
    const isFollowUp = question.depth > 1;

    return (
        <div className={styles.exchange}>
            <div className={styles.turn}>
                <span className={`${styles.avatar} ${styles.avatarInterviewer}`} aria-hidden="true">
                    <MessageCircleQuestion size={16} />
                </span>
                <div className={styles.turnBody}>
                    <span className={styles.speaker}>
                        {isFollowUp ? 'Interviewer follows up' : 'Interviewer asks'}
                    </span>
                    <p className={styles.prompt}>{question.prompt}</p>
                    {!revealed && (
                        <div className={styles.revealRow}>
                            <button
                                type="button"
                                className={styles.revealBtn}
                                aria-expanded={false}
                                aria-controls={answerId}
                                onClick={() => setRevealed(true)}
                            >
                                <Eye size={15} aria-hidden="true" />
                                Reveal answer
                            </button>
                            <span className={styles.revealHint}>
                                Answer it out loud first, then compare.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {revealed && (
                <div className={styles.turn} id={answerId}>
                    <span className={`${styles.avatar} ${styles.avatarYou}`} aria-hidden="true">
                        <UserRound size={16} />
                    </span>
                    <div className={`${styles.turnBody} ${styles.answerBubble}`}>
                        <span className={styles.speaker}>A strong answer</span>
                        {question.answer ? (
                            <BeginnerAnswer answer={question.answer} />
                        ) : (
                            <>
                                <div className={styles.answerText}>{paragraphs(question.answerShort ?? '')}</div>

                                <button
                                    type="button"
                                    className={styles.deepToggle}
                                    aria-expanded={deepOpen}
                                    aria-controls={deepId}
                                    onClick={() => setDeepOpen(o => !o)}
                                >
                                    <ChevronDown
                                        size={15}
                                        aria-hidden="true"
                                        className={deepOpen ? styles.chevronOpen : styles.chevron}
                                    />
                                    {deepOpen ? 'Show less' : 'Go deeper'}
                                </button>
                                {deepOpen && (
                                    <div id={deepId} className={`${styles.answerText} ${styles.deepText}`}>
                                        {paragraphs(question.answerDeep ?? '')}
                                    </div>
                                )}

                                <div className={styles.why}>
                                    <Lightbulb size={15} aria-hidden="true" className={styles.whyIcon} />
                                    <div>
                                        <span className={styles.whyLabel}>Why they ask this</span>
                                        <div className={styles.answerText}>{paragraphs(question.answerSignal ?? '')}</div>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            className={styles.hideBtn}
                            onClick={() => {
                                setRevealed(false);
                                setDeepOpen(false);
                            }}
                        >
                            Hide answer
                        </button>
                    </div>
                </div>
            )}

            {revealed && question.followUps.length > 0 && (
                <div className={styles.followUps}>
                    <div className={styles.digDeeper}>
                        <span>The interviewer digs deeper</span>
                    </div>
                    {question.followUps.map(f => (
                        <Exchange key={f.id} question={f} />
                    ))}
                </div>
            )}
        </div>
    );
};

export interface InterviewQuestionCardProps {
    question: InterviewQuestion;
    /** Shown as "Q3". Omitted, the card has no number. */
    number?: number;
    /** Offers a way back to the lesson that teaches the answer. */
    onRevise?: (question: InterviewQuestion) => void;
}

/** An opening question and the chain of follow-ups behind it. */
export const InterviewQuestionCard: React.FC<InterviewQuestionCardProps> = ({
    question,
    number,
    onRevise
}) => {
    const followUpCount = countQuestions(question.followUps);
    return (
        <article className={styles.card}>
            <header className={styles.cardHead}>
                {number !== undefined && <span className={styles.qNumber}>Q{number}</span>}
                {followUpCount > 0 && (
                    <span
                        className={styles.chainChip}
                        title="Reveal the answer to see what the interviewer asks next"
                    >
                        {followUpCount} follow-up{followUpCount === 1 ? '' : 's'}
                    </span>
                )}
                <ReportedBadge sightings={question.sightings} />
            </header>

            <Exchange question={question} />

            {onRevise && question.subtopicTitle && (
                <footer className={styles.cardFoot}>
                    <button type="button" className={styles.reviseLink} onClick={() => onRevise(question)}>
                        Not sure? Revise the lesson: {question.subtopicTitle}
                        <ArrowRight size={14} aria-hidden="true" />
                    </button>
                </footer>
            )}
        </article>
    );
};
