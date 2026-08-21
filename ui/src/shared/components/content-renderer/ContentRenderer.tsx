import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, ChevronLeft, ChevronRight, Code, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { submitQuizAnswer } from '../../api/profile.api';
/**
 * Lazy: mermaid is ~3 MB minified, and most content blocks contain no diagram at all.
 * Loading it eagerly put that weight on every learner's first paint.
 */
const MermaidDiagram = React.lazy(() =>
    import('../mermaid').then((m) => ({ default: m.MermaidDiagram }))
);
import { CodePlayground } from '../code-playground';
import { isExecutableLanguage, formatExecutableCode } from '../../utils/codeWrapper';
import styles from './ContentRenderer.module.css';

export interface QuizQuestionItem {
    id: string;
    kind?: 'mcq' | 'true_false' | 'fill_blank' | string;
    prompt?: string;
    question?: string;
    options?: string[];
    correctAnswer?: string;
    answer?: string;
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

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface ContentRendererProps {
    blocks: ContentBlockItem[];
    isSubtopicCompleted?: boolean;
    hideHeader?: boolean;
    onQuizAnswered?: (questionId: string, isCorrect: boolean, isFirstAttempt: boolean) => void;
    onAllQuizzesAnsweredChange?: (allAnswered: boolean) => void;
    onOpenFullCompiler?: (code: string, language: string) => void;
}

const CodeBlockRenderer: React.FC<{
    codeString: string;
    lang: string;
    onOpenFullCompiler?: (code: string, language: string) => void;
}> = ({ codeString, lang, onOpenFullCompiler }) => {
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cleanLang = (lang || '').trim().toLowerCase();
    if (cleanLang === 'mermaid') {
        return (
            <React.Suspense fallback={<div className={styles.codeSection}>Loading diagram…</div>}>
                <MermaidDiagram chart={codeString} />
            </React.Suspense>
        );
    }

    const executable = isExecutableLanguage(cleanLang);
    const preparedCode = executable ? formatExecutableCode(codeString, cleanLang) : codeString;

    return (
        <div className={styles.codeSection}>
            <div className={styles.codeSectionHeader}>
                <span className={styles.codeSectionLabel}>
                    <Code size={14} style={{ marginRight: '6px' }} />
                    {cleanLang ? cleanLang.toUpperCase() : 'CODE'}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={handleCopy}
                        title="Copy code"
                    >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    {executable && (
                        <button
                            type="button"
                            className={`${styles.playgroundToggleBtn} ${isOpen ? styles.playgroundToggleBtnActive : ''}`}
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? '✕ Hide Playground' : '⚡ Try in Playground'}
                        </button>
                    )}
                </div>
            </div>

            {isOpen && executable ? (
                <CodePlayground
                    initialCode={preparedCode}
                    language={cleanLang === 'javascript' || cleanLang === 'js' ? 'javascript' : cleanLang}
                    onOpenFullEditor={onOpenFullCompiler}
                />
            ) : (
                <pre className={styles.codeBlock}>
                    {cleanLang && <span className={styles.codeLang}>{cleanLang}</span>}
                    <code>{codeString}</code>
                </pre>
            )}
        </div>
    );
};

export const ContentRenderer: React.FC<ContentRendererProps> = ({
    blocks,
    isSubtopicCompleted = false,
    hideHeader = false,
    onQuizAnswered,
    onAllQuizzesAnsweredChange,
    onOpenFullCompiler
}) => {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
    const [submittedStates, setSubmittedStates] = useState<Record<string, boolean>>({});
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<Record<string, number>>({});
    const [validatedResults, setValidatedResults] = useState<Record<string, { isCorrect: boolean; correctAnswer?: string; explanation?: string }>>({});

    const allQuestions = blocks
        .filter(b => b.type === 'quiz' && b.questions)
        .flatMap(b => b.questions || []);

    const blockKey = blocks.map(b => b.id).join(':');

    useEffect(() => {
        if (!isSubtopicCompleted) {
            setSelectedAnswers({});
            setSubmittedStates({});
            setAttemptCounts({});
            setActiveQuestionIndex({});
            setValidatedResults({});
        }
    }, [blockKey, isSubtopicCompleted]);

    useEffect(() => {
        if (isSubtopicCompleted && allQuestions.length > 0) {
            const preFilledSubmitted: Record<string, boolean> = {};
            const preFilledAnswers: Record<string, string> = {};
            allQuestions.forEach(q => {
                preFilledSubmitted[q.id] = true;
                if (q.correctAnswer) preFilledAnswers[q.id] = q.correctAnswer;
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

    const handleSubmitQuiz = async (q: QuizQuestionItem) => {
        const selected = selectedAnswers[q.id];
        if (!selected) return;

        const currentAttempts = (attemptCounts[q.id] || 0) + 1;
        setAttemptCounts(prev => ({ ...prev, [q.id]: currentAttempts }));

        let isCorrect = false;
        let correctAnswer = q.correctAnswer;
        let explanation = q.explanation;

        try {
            const res = await submitQuizAnswer(q.id, selected);
            isCorrect = res.isCorrect;
            correctAnswer = res.correctAnswer || q.correctAnswer;
            explanation = res.explanation || q.explanation;
        } catch (err) {
            console.warn("Falling back to client validation:", err);
            if (q.correctAnswer) {
                isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
            }
        }

        setValidatedResults(prev => ({
            ...prev,
            [q.id]: { isCorrect, correctAnswer, explanation }
        }));
        setSubmittedStates(prev => ({ ...prev, [q.id]: true }));

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

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h2 className={styles.heading2}>{children}</h2>,
                    h2: ({ children }) => <h2 className={styles.heading2}>{children}</h2>,
                    h3: ({ children }) => <h3 className={styles.heading3}>{children}</h3>,
                    h4: ({ children }) => <h4 className={styles.heading4}>{children}</h4>,
                    p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
                    ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
                    ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
                    img: ({ src, alt }) => (
                        <div className={styles.imageWrapper}>
                            <img src={src} alt={alt || 'Content visual'} className={styles.contentImage} loading="lazy" />
                            {alt && <span className={styles.imageCaption}>{alt}</span>}
                        </div>
                    ),
                    table: ({ children }) => (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>{children}</table>
                        </div>
                    ),
                    code(props: React.ComponentPropsWithoutRef<'code'> & { node?: unknown }) {
                        const { className, children, ...rest } = props;
                        const match = /language-(\S+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        const isInline = !className;
                        const codeString = String(children || '').replace(/\n$/, '');

                        if (isInline) {
                            return <code className="inline-code" {...rest}>{children}</code>;
                        }

                        return (
                            <CodeBlockRenderer
                                codeString={codeString}
                                lang={lang}
                                onOpenFullCompiler={onOpenFullCompiler}
                            />
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        );
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

                    const promptText = q.prompt || q.question || 'Question';
                    const selected = selectedAnswers[q.id] || '';
                    const isSubmitted = submittedStates[q.id];
                    const valRes = validatedResults[q.id];
                    const actualCorrectAnswer = valRes?.correctAnswer || q.correctAnswer || q.answer || '';
                    const actualExplanation = valRes?.explanation || q.explanation;
                    const isCorrect = valRes ? valRes.isCorrect : (actualCorrectAnswer ? selected.trim().toLowerCase() === actualCorrectAnswer.trim().toLowerCase() : false);
                    const attempts = attemptCounts[q.id] || 0;
                    const allInBlockSubmitted = block.questions.every(item => Boolean(submittedStates[item.id]));

                    const hasOptions = Array.isArray(q.options) && q.options.length > 0;
                    const optionsToRender = hasOptions 
                        ? q.options! 
                        : (q.kind === 'true_false' ? ['True', 'False'] : []);

                    return (
                        <div key={block.id} className={styles.quizBlock}>
                            {!hideHeader && (
                                <div className={styles.quizHeader} style={{ justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <HelpCircle size={20} /> Concept Check
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
                            )}

                            {hideHeader && allInBlockSubmitted && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                                    <button
                                        type="button"
                                        className={styles.steppedNavBtn}
                                        onClick={() => handleRetakeFullQuiz(block.id, block.questions!)}
                                        title="Retake all MCQs in this test"
                                    >
                                        <RotateCcw size={14} /> Retake Test
                                    </button>
                                </div>
                            )}

                            <div>
                                <h4 className={styles.quizPrompt}>{promptText}</h4>

                                {optionsToRender.length > 0 ? (
                                    <div className={styles.quizOptions}>
                                        {optionsToRender.map((opt, oIdx) => {
                                            let btnStyle = styles.optionBtn;
                                            if (selected === opt) btnStyle += ` ${styles.optionBtnSelected}`;
                                            if (isSubmitted && actualCorrectAnswer && opt.trim().toLowerCase() === actualCorrectAnswer.trim().toLowerCase()) {
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
                                                    <span className={styles.optionBadge}>{OPTION_LETTERS[oIdx] || oIdx + 1}</span>
                                                    <span className={styles.optionText}>{opt}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                                        <input
                                            type="text"
                                            value={selected}
                                            onChange={(e) => !isSubmitted && handleSelectOption(q.id, e.target.value)}
                                            placeholder="Type your answer here..."
                                            disabled={isSubmitted}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.95rem',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !isSubmitted && selected.trim()) {
                                                    handleSubmitQuiz(q);
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {!isSubmitted ? (
                                        <button
                                            type="button"
                                            className={styles.submitQuizBtn}
                                            onClick={() => handleSubmitQuiz(q)}
                                            disabled={!selected.trim()}
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
                                                    Incorrect answer. {actualCorrectAnswer && `(Correct answer: ${actualCorrectAnswer})`}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {isSubmitted && actualExplanation && (
                                    <div className={styles.explanationBox}>
                                        <strong>Explanation:</strong> {actualExplanation}
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
