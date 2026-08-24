import React, { useEffect, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import styles from './TestCasePanel.module.css';
import type { DsaRunResult, DsaSample, DsaSubmitResult, DsaVerdict } from '../../api/dsa.api';

const VERDICT_LABELS: Record<DsaVerdict, string> = {
    ACCEPTED: 'Accepted',
    WRONG_ANSWER: 'Wrong answer',
    COMPILE_ERROR: 'Compile error',
    RUNTIME_ERROR: 'Runtime error',
    TIME_LIMIT: 'Time limit exceeded',
    ENGINE_ERROR: 'Could not run',
    EXECUTED: 'Executed'
};

export interface TestCasePanelProps {
    samples: DsaSample[];
    result: DsaRunResult | DsaSubmitResult | null;
    isBusy: boolean;
    error: string | null;
    extraCases: string[];
    onExtraCasesChange: (cases: string[]) => void;
    judgeable: boolean;
}

const verdictClass = (verdict: DsaVerdict) => {
    if (verdict === 'ACCEPTED') return styles.verdictAccepted;
    if (verdict === 'EXECUTED') return styles.verdictNeutral;
    return styles.verdictFailed;
};

export const TestCasePanel: React.FC<TestCasePanelProps> = ({
    samples,
    result,
    isBusy,
    error,
    extraCases,
    onExtraCasesChange,
    judgeable
}) => {
    const [activeCase, setActiveCase] = useState(0);

    /**
     * A failed run should land the learner on the case that failed, not leave them on case 1
     * wondering where the red went.
     */
    useEffect(() => {
        if (result?.firstFailedCase) {
            setActiveCase(result.firstFailedCase - 1);
        }
    }, [result]);

    const cases = result?.cases ?? [];
    const selected = cases[activeCase];
    const sample = samples[activeCase];

    const overall = result?.verdict;
    const isSubmit = result !== null && 'submissionId' in (result as DsaSubmitResult);
    const submitResult = isSubmit ? (result as DsaSubmitResult) : null;

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <span className={styles.heading}>Test cases</span>
                {overall && (
                    <span className={`${styles.verdict} ${verdictClass(overall)}`}>
                        {overall === 'ACCEPTED' ? <Check size={12} /> : <X size={12} />}
                        {VERDICT_LABELS[overall] ?? overall}
                    </span>
                )}
                {submitResult?.newlySolved && submitResult.pointsAwarded > 0 && (
                    <span className={styles.points}>
                        <Sparkles size={13} /> +{submitResult.pointsAwarded} points
                    </span>
                )}
                {result && (
                    <span className={styles.stats}>
                        {result.passedCount} / {result.totalCount} passed
                        {result.runtimeMs != null ? ` · ${result.runtimeMs} ms` : ''}
                    </span>
                )}
            </div>

            {cases.length > 0 && (
                <div className={styles.caseTabs}>
                    {cases.map((item, index) => (
                        <button
                            key={`${item.caseNumber}`}
                            type="button"
                            className={[
                                styles.caseTab,
                                index === activeCase ? styles.caseTabActive : '',
                                item.verdict === 'ACCEPTED' ? styles.casePass : '',
                                item.verdict !== 'ACCEPTED' && item.verdict !== 'EXECUTED'
                                    ? styles.caseFail
                                    : ''
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onClick={() => setActiveCase(index)}
                        >
                            {item.verdict === 'ACCEPTED' ? (
                                <Check size={11} strokeWidth={3} />
                            ) : item.verdict === 'EXECUTED' ? null : (
                                <X size={11} strokeWidth={3} />
                            )}
                            Case {item.caseNumber}
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.body}>
                {error && <pre className={`${styles.pre} ${styles.preError}`}>{error}</pre>}

                {result?.compileOutput && (
                    <div className={styles.field}>
                        <span className={styles.fieldLabel}>Compiler</span>
                        {/* Line numbers here are already the learner's own, not the driver's. */}
                        <pre className={`${styles.pre} ${styles.preError}`}>
                            {result.compileOutput}
                        </pre>
                    </div>
                )}

                {result?.stderr && !result.compileOutput && (
                    <div className={styles.field}>
                        <span className={styles.fieldLabel}>Error output</span>
                        <pre className={`${styles.pre} ${styles.preError}`}>{result.stderr}</pre>
                    </div>
                )}

                {selected && !selected.sample && (
                    <p className={styles.hiddenNote}>
                        Case {selected.caseNumber} is a hidden test —{' '}
                        {VERDICT_LABELS[selected.verdict]?.toLowerCase() ?? selected.verdict}. Its
                        input stays hidden so the problem keeps its teeth.
                    </p>
                )}

                {selected?.sample && (
                    <>
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Input</span>
                            <pre className={styles.pre}>{selected.input ?? sample?.input ?? '—'}</pre>
                        </div>
                        {selected.expectedOutput != null && (
                            <div className={styles.field}>
                                <span className={styles.fieldLabel}>Expected</span>
                                <pre className={styles.pre}>{selected.expectedOutput || '—'}</pre>
                            </div>
                        )}
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Your output</span>
                            <pre
                                className={`${styles.pre} ${
                                    selected.verdict === 'WRONG_ANSWER' ? styles.preError : ''
                                }`}
                            >
                                {selected.actualOutput?.trim() || '(nothing printed)'}
                            </pre>
                        </div>
                    </>
                )}

                {!result && !error && (
                    <>
                        {samples.length > 0 && (
                            <div className={styles.field}>
                                <span className={styles.fieldLabel}>Example input</span>
                                <pre className={styles.pre}>{samples[0].input}</pre>
                            </div>
                        )}
                        <p className={styles.idle}>
                            {isBusy
                                ? 'Running...'
                                : judgeable
                                  ? 'Run to check your code against the examples.'
                                  : 'This problem has no test cases yet.'}
                        </p>
                    </>
                )}

                {judgeable && (
                    <div className={styles.field}>
                        <span className={styles.fieldLabel}>Your own case (optional)</span>
                        <textarea
                            className={styles.textarea}
                            value={extraCases[0] ?? ''}
                            placeholder={'One case, in the same shape as the example input above.'}
                            onChange={e =>
                                onExtraCasesChange(e.target.value.trim() ? [e.target.value] : [])
                            }
                            aria-label="Your own test case"
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestCasePanel;
