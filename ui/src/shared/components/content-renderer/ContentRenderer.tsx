import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ContentRenderer.module.css';

export interface QuizQuestionItem {
    id: string;
    kind: 'mcq' | 'true_false' | 'fill_blank';
    prompt: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points?: number;
}

export interface ContentBlockItem {
    id: string;
    orderIndex: number;
    type: 'markdown' | 'quiz' | 'callout';
    body?: string;
    questions?: QuizQuestionItem[];
}

interface ContentRendererProps {
    blocks: ContentBlockItem[];
    isSubtopicCompleted?: boolean;
    onQuizAnswered?: (questionId: string, isCorrect: boolean, isFirstAttempt: boolean) => void;
    onAllQuizzesAnsweredChange?: (allAnswered: boolean) => void;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
    blocks,
    isSubtopicCompleted = false,
    onQuizAnswered,
    onAllQuizzesAnsweredChange
}) => {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
    const [submittedStates, setSubmittedStates] = useState<Record<string, boolean>>({});
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<Record<string, number>>({});

    const allQuestions = blocks
        .filter(b => b.type === 'quiz' && b.questions)
        .flatMap(b => b.questions || []);

    useEffect(() => {
        if (isSubtopicCompleted && allQuestions.length > 0) {
            const preFilledSubmitted: Record<string, boolean> = {};
            const preFilledAnswers: Record<string, string> = {};
            allQuestions.forEach(q => {
                preFilledSubmitted[q.id] = true;
                preFilledAnswers[q.id] = q.correctAnswer;
            });
            setSubmittedStates(prev => ({ ...preFilledSubmitted, ...prev }));
            setSelectedAnswers(prev => ({ ...preFilledAnswers, ...prev }));
        }
    }, [isSubtopicCompleted, allQuestions.length]);

    useEffect(() => {
        if (allQuestions.length === 0 || isSubtopicCompleted) {
            if (onAllQuizzesAnsweredChange) onAllQuizzesAnsweredChange(true);
            return;
        }

        const allAnswered = allQuestions.every(q => Boolean(submittedStates[q.id]));
        if (onAllQuizzesAnsweredChange) {
            onAllQuizzesAnsweredChange(allAnswered);
        }
    }, [submittedStates, allQuestions.length, isSubtopicCompleted]);

    const handleSelectOption = (questionId: string, option: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmitQuiz = (q: QuizQuestionItem) => {
        const selected = selectedAnswers[q.id];
        if (!selected) return;

        const currentAttempts = (attemptCounts[q.id] || 0) + 1;
        setAttemptCounts(prev => ({ ...prev, [q.id]: currentAttempts }));
        setSubmittedStates(prev => ({ ...prev, [q.id]: true }));

        const isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        const isFirstAttempt = currentAttempts === 1;

        if (onQuizAnswered) {
            onQuizAnswered(q.id, isCorrect, isFirstAttempt);
        }
    };

    const handleRetakeFullQuiz = (blockId: string, questions: QuizQuestionItem[]) => {
        const resetSubmitted = { ...submittedStates };
        const resetAnswers = { ...selectedAnswers };
        questions.forEach(q => {
            resetSubmitted[q.id] = false;
            resetAnswers[q.id] = '';
        });
        setSubmittedStates(resetSubmitted);
        setSelectedAnswers(resetAnswers);
        setActiveQuestionIndex(prev => ({ ...prev, [blockId]: 0 }));
    };

    const renderMarkdown = (content: string) => {
        if (!content) return null;
        const parts = content.split(/```/);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                const lines = part.split('\n');
                const lang = lines[0].trim();
                const code = lines.slice(1).join('\n').trim();
                return (
                    <pre key={index} className={styles.codeBlock}>
                        {lang && <span className={styles.codeLang}>{lang}</span>}
                        <code>{code}</code>
                    </pre>
                );
            } else {
                return (
                    <div key={index} className={styles.markdownBlock}>
                        {part.split('\n\n').map((paragraph, pIdx) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;
                            const formatted = trimmed
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
                            return <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatted }} />;
                        })}
                    </div>
                );
            }
        });
    };

    return (
        <div className={styles.contentRenderer}>
            {blocks.map(block => {
                if (block.type === 'markdown' || block.type === 'callout') {
                    return <div key={block.id}>{renderMarkdown(block.body || '')}</div>;
                }

                if (block.type === 'quiz' && block.questions && block.questions.length > 0) {
                    const totalQ = block.questions.length;
                    const currentIdx = activeQuestionIndex[block.id] || 0;
                    const q = block.questions[currentIdx];

                    const selected = selectedAnswers[q.id] || '';
                    const isSubmitted = submittedStates[q.id];
                    const isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                    const attempts = attemptCounts[q.id] || 0;
                    const allInBlockSubmitted = block.questions.every(item => Boolean(submittedStates[item.id]));

                    return (
                        <div key={block.id} className={styles.quizBlock}>
                            <div className={styles.quizHeader} style={{ justifyContent: 'space-between' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <HelpCircle size={20} /> Concept Check Quiz
                                </span>
                                {allInBlockSubmitted && (
                                    <button
                                        type="button"
                                        className={styles.steppedNavBtn}
                                        onClick={() => handleRetakeFullQuiz(block.id, block.questions!)}
                                        title="Retake all MCQs in this test"
                                    >
                                        <RotateCcw size={14} /> Retake Test
                                    </button>
                                )}
                            </div>

                            <div>
                                <h4 className={styles.quizPrompt}>{q.prompt}</h4>

                                <div className={styles.quizOptions}>
                                    {(q.options || ['True', 'False']).map((opt, oIdx) => {
                                        let btnStyle = styles.optionBtn;
                                        if (selected === opt) btnStyle += ` ${styles.optionBtnSelected}`;
                                        if (isSubmitted && opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
                                            btnStyle += ` ${styles.optionBtnCorrect}`;
                                        } else if (isSubmitted && selected === opt && !isCorrect) {
                                            btnStyle += ` ${styles.optionBtnIncorrect}`;
                                        }

                                        return (
                                            <button
                                                key={oIdx}
                                                type="button"
                                                className={btnStyle}
                                                onClick={() => !isSubmitted && handleSelectOption(q.id, opt)}
                                                disabled={isSubmitted}
                                            >
                                                <span>{opt}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {!isSubmitted ? (
                                        <button
                                            type="button"
                                            className={styles.submitQuizBtn}
                                            onClick={() => handleSubmitQuiz(q)}
                                            disabled={!selected}
                                        >
                                            Submit Answer
                                        </button>
                                    ) : (
                                        <>
                                            {isCorrect ? (
                                                <div style={{ color: 'var(--tech-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <CheckCircle2 size={18} />
                                                    Correct! {attempts === 1 ? '(+5 XP awarded)' : '(Retry complete)'}
                                                </div>
                                            ) : (
                                                <div style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <XCircle size={18} />
                                                    Incorrect answer. (0 pts)
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {isSubmitted && q.explanation && (
                                    <div className={styles.explanationBox}>
                                        <strong>Explanation:</strong> {q.explanation}
                                    </div>
                                )}
                            </div>

                            {/* Stepped Navigation (One by one) */}
                            {totalQ > 1 && (
                                <div className={styles.steppedNavRow}>
                                    <button
                                        type="button"
                                        className={styles.steppedNavBtn}
                                        disabled={currentIdx === 0}
                                        onClick={() => setActiveQuestionIndex(prev => ({ ...prev, [block.id]: currentIdx - 1 }))}
                                    >
                                        <ChevronLeft size={16} /> Previous MCQ
                                    </button>
                                    <span className={styles.stepIndicator}>
                                        Question {currentIdx + 1} of {totalQ}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.steppedNavBtn}
                                        disabled={currentIdx === totalQ - 1}
                                        onClick={() => setActiveQuestionIndex(prev => ({ ...prev, [block.id]: currentIdx + 1 }))}
                                    >
                                        Next MCQ <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default ContentRenderer;
