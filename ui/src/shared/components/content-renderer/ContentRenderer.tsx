import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
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
    onQuizAnswered?: (questionId: string, isCorrect: boolean, isFirstAttempt: boolean) => void;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ blocks, onQuizAnswered }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
    const [submittedStates, setSubmittedStates] = useState<Record<string, boolean>>({});

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

    const handleRetry = (qId: string) => {
        setSubmittedStates(prev => ({ ...prev, [qId]: false }));
        setSelectedAnswers(prev => ({ ...prev, [qId]: '' }));
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

                if (block.type === 'quiz' && block.questions) {
                    return (
                        <div key={block.id} className={styles.quizBlock}>
                            <div className={styles.quizHeader}>
                                <HelpCircle size={20} /> Concept Check Quiz
                            </div>
                            {block.questions.map(q => {
                                const selected = selectedAnswers[q.id] || '';
                                const isSubmitted = submittedStates[q.id];
                                const isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                                const attempts = attemptCounts[q.id] || 0;

                                return (
                                    <div key={q.id}>
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
                                                            Incorrect answer.
                                                        </div>
                                                    )}

                                                    {!isCorrect && (
                                                        <button
                                                            type="button"
                                                            className={styles.submitQuizBtn}
                                                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                                            onClick={() => handleRetry(q.id)}
                                                        >
                                                            <RotateCcw size={14} /> Retry
                                                        </button>
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
                                );
                            })}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default ContentRenderer;
