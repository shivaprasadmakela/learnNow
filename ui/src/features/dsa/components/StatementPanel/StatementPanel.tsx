import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, ExternalLink, Lightbulb, XCircle } from 'lucide-react';
import styles from './StatementPanel.module.css';
import { DifficultyBadge } from '../../../../shared/components/ui/Badge';
import { ContentRenderer } from '../../../../shared/components/content-renderer';
import { answerDsaCheck, type DsaCheck, type DsaProblemDetail } from '../../api/dsa.api';

interface CheckState {
    selected: string;
    correct: boolean;
    correctAnswer: string;
    explanation?: string;
}

/** Progressive hints: the next one unlocks only once the previous has been read. */
const HintStack: React.FC<{ hints: DsaProblemDetail['hints'] }> = ({ hints }) => {
    const [revealed, setRevealed] = useState(0);

    if (hints.length === 0) return null;

    return (
        <div>
            <p className={styles.sectionLabel}>Hints</p>
            <div className={styles.hints}>
                {hints.slice(0, revealed).map((hint, index) => (
                    <div key={hint.id} className={styles.hint}>
                        <span className={styles.hintIndex}>Hint {index + 1}</span>
                        {hint.body}
                    </div>
                ))}
                {revealed < hints.length && (
                    <button
                        type="button"
                        className={styles.revealBtn}
                        onClick={() => setRevealed(n => n + 1)}
                    >
                        <Lightbulb size={14} />
                        {revealed === 0
                            ? `Show a hint (${hints.length} available)`
                            : `Show hint ${revealed + 1} of ${hints.length}`}
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * The inline question.
 *
 * The answer is not in this component's props — it arrives only in the response to the answer
 * endpoint, after the server has compared. Nothing here can be read out of the page to cheat.
 */
const InlineCheck: React.FC<{ check: DsaCheck; canAnswer: boolean }> = ({ check, canAnswer }) => {
    const [state, setState] = useState<CheckState | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const answer = async (option: string) => {
        if (state || isBusy || !canAnswer) return;
        setIsBusy(true);
        try {
            const result = await answerDsaCheck(check.id, option);
            setState({
                selected: option,
                correct: result.correct,
                correctAnswer: result.correctAnswer,
                explanation: result.explanation
            });
        } catch (err) {
            console.error('Could not check that answer', err);
        } finally {
            setIsBusy(false);
        }
    };

    const classFor = (option: string) => {
        if (!state) return styles.option;
        if (option === state.correctAnswer) return `${styles.option} ${styles.optionCorrect}`;
        if (option === state.selected) return `${styles.option} ${styles.optionWrong}`;
        return styles.option;
    };

    return (
        <div className={styles.check}>
            <p className={styles.checkPrompt}>{check.prompt}</p>
            <div className={styles.options}>
                {check.options.map(option => (
                    <button
                        key={option}
                        type="button"
                        className={classFor(option)}
                        onClick={() => answer(option)}
                        disabled={Boolean(state) || isBusy || !canAnswer}
                    >
                        <span className={styles.bullet}>
                            {state && option === state.correctAnswer && <Check size={11} strokeWidth={3} />}
                        </span>
                        {option}
                    </button>
                ))}
            </div>
            {state && (
                <p className={styles.checkFeedback}>
                    {state.correct ? 'That is right. ' : 'Not quite. '}
                    {state.explanation}
                </p>
            )}
            {!canAnswer && !state && (
                <p className={styles.checkFeedback}>Sign in to answer and collect the points.</p>
            )}
        </div>
    );
};

export interface StatementPanelProps {
    problem: DsaProblemDetail;
    isLoggedIn: boolean;
}

export const StatementPanel: React.FC<StatementPanelProps> = ({ problem, isLoggedIn }) => {
    /**
     * The statement goes through the same renderer as lesson content, so a problem can use fenced
     * code, tables and diagrams without this panel knowing anything about them.
     */
    const blocks = useMemo(
        () => [
            {
                id: `${problem.id}-statement`,
                orderIndex: 1,
                type: 'markdown' as const,
                body: problem.statement
            }
        ],
        [problem.id, problem.statement]
    );

    return (
        <div className={styles.panel}>
            <div>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>{problem.title}</h1>
                    <DifficultyBadge difficulty={problem.difficulty} />
                    {problem.progress.status === 'SOLVED' && (
                        <span className={styles.solvedBadge}>
                            <CheckCircle2 size={12} /> Solved
                        </span>
                    )}
                    {problem.progress.status === 'ATTEMPTED' && (
                        <span className={styles.solvedBadge} style={{ color: 'var(--text-tertiary)' }}>
                            <XCircle size={12} /> Attempted
                        </span>
                    )}
                </div>
                <div className={styles.metaRow}>
                    <span>{problem.stepTitle}</span>
                    <span>{problem.estimatedMinutes} min</span>
                    {problem.practiceUrl && (
                        <a
                            className={styles.practiceLink}
                            href={problem.practiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Practice on {problem.practicePlatform || 'the judge'}
                            <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            </div>

            {problem.statement.trim() && <ContentRenderer blocks={blocks} hideHeader />}

            {/*
              Examples render from the sample test cases rather than from prose, so the worked
              example on screen is literally the case that runs. Hand-written examples drift.
            */}
            {problem.samples.length > 0 && (
                <div>
                    <p className={styles.sectionLabel}>Examples</p>
                    {problem.samples.map((sample, index) => (
                        <div key={sample.id} className={styles.example}>
                            <div className={styles.exampleTitle}>Example {index + 1}</div>
                            <div className={styles.ioRow}>
                                <span className={styles.ioLabel}>Input</span>
                                <span className={styles.ioValue}>{sample.input.trim()}</span>
                            </div>
                            <div className={styles.ioRow}>
                                <span className={styles.ioLabel}>Output</span>
                                <span className={styles.ioValue}>
                                    {sample.expectedOutput.trim() || '—'}
                                </span>
                            </div>
                            {sample.explanation && (
                                <p className={styles.exampleNote}>{sample.explanation}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {problem.checks.map(check => (
                <InlineCheck key={check.id} check={check} canAnswer={isLoggedIn} />
            ))}

            <HintStack hints={problem.hints} />
        </div>
    );
};

export default StatementPanel;
