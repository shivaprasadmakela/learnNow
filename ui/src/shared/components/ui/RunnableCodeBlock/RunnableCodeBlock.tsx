import React, { useState } from 'react';
import { MonacoEditorPane } from '../../editor/MonacoEditorPane/MonacoEditorPane';
import { CompilerOutputPane } from '../../editor/CompilerOutputPane/CompilerOutputPane';
import { useCodeExecution } from '../../editor/useCodeExecution';
import { Play, RotateCcw, Copy, Check, CheckCircle2, AlertTriangle, Maximize2, Minimize2, X } from 'lucide-react';
import type { RunnableCodeBlockProps } from './RunnableCodeBlock.types';
import styles from './RunnableCodeBlock.module.css';

export const RunnableCodeBlock: React.FC<RunnableCodeBlockProps> = ({
    snippet,
    onCodeChange
}) => {
    const [code, setCode] = useState<string>(snippet.code);
    const [stdin, setStdin] = useState<string>('');
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [hasExecuted, setHasExecuted] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { logs, htmlPreview, isRunning, executionTimeMs, runCode, clearConsole } = useCodeExecution();

    const handleRun = async () => {
        setHasExecuted(true);
        await runCode(code, snippet.language || 'javascript', stdin);
    };

    const handleReset = () => {
        setCode(snippet.code);
        setHasExecuted(false);
        clearConsole();
        if (onCodeChange) onCodeChange(snippet.code);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Calculate diff against expected output if provided
    const lastLogEntry = logs.length > 0 ? logs[logs.length - 1] : null;
    const actualOutput = lastLogEntry?.type === 'log' ? lastLogEntry.message.trim() : '';
    const expected = (snippet.expectedOutput || '').trim();

    const isMatch = expected && hasExecuted && actualOutput === expected;
    const isMismatch = expected && hasExecuted && actualOutput && actualOutput !== expected;

    const renderEditorAndOutput = (isPopup = false) => (
        <div className={isPopup ? styles.popupSplitBody : styles.splitBody}>
            <div className={styles.editorBox}>
                <MonacoEditorPane
                    code={code}
                    language={snippet.language || 'javascript'}
                    onChange={(val) => {
                        setCode(val);
                        if (onCodeChange) onCodeChange(val);
                    }}
                    onRun={handleRun}
                />
            </div>
            <div className={styles.outputBox}>
                <CompilerOutputPane
                    logs={logs}
                    htmlPreview={htmlPreview}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    onClear={clearConsole}
                    executionTimeMs={executionTimeMs}
                    isHtml={snippet.language === 'html'}
                />
            </div>
        </div>
    );

    return (
        <>
            <div className={styles.codeBlockCard}>
                <div className={styles.header}>
                    <div className={styles.labelGroup}>
                        <span className={styles.snippetTitle}>
                            {snippet.label || `Snippet ${snippet.id}`}
                        </span>
                        <span className={styles.langBadge}>{snippet.language}</span>
                    </div>
                    <div className={styles.actions}>
                        <button type="button" className={styles.btn} onClick={handleCopy} title="Copy Code">
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            {isCopied ? 'Copied' : 'Copy'}
                        </button>
                        <button type="button" className={styles.btn} onClick={handleReset} title="Reset to Default">
                            <RotateCcw size={13} /> Reset
                        </button>
                        {snippet.runnable !== false && (
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.runBtn}`}
                                onClick={handleRun}
                                disabled={isRunning}
                                title="Run Code"
                            >
                                <Play size={13} /> {isRunning ? 'Running…' : 'Run'}
                            </button>
                        )}
                        <button
                            type="button"
                            className={styles.btn}
                            onClick={() => setIsExpanded(true)}
                            title="Expand Editor Popup"
                        >
                            <Maximize2 size={13} /> Expand
                        </button>
                    </div>
                </div>

                {renderEditorAndOutput(false)}

                {/* Expected Output Match / Mismatch Banner */}
                {expected && isMatch && (
                    <div className={`${styles.diffBanner} ${styles.diffMatch}`}>
                        <CheckCircle2 size={16} />
                        <span>Output matches expected output!</span>
                    </div>
                )}
                {expected && isMismatch && (
                    <div className={`${styles.diffBanner} ${styles.diffMismatch}`}>
                        <AlertTriangle size={16} />
                        <span>Output differs from expected: <code>"{expected}"</code></span>
                    </div>
                )}
            </div>

            {/* Fullscreen Expander Popup Modal */}
            {isExpanded && (
                <div className={styles.modalOverlay} onClick={() => setIsExpanded(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.labelGroup}>
                                <span className={styles.snippetTitle}>
                                    ⚡ {snippet.label || `Snippet ${snippet.id}`} (Expanded Editor)
                                </span>
                                <span className={styles.langBadge}>{snippet.language}</span>
                            </div>
                            <div className={styles.actions}>
                                <button type="button" className={styles.btn} onClick={handleCopy} title="Copy Code">
                                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                                    {isCopied ? 'Copied' : 'Copy'}
                                </button>
                                <button type="button" className={styles.btn} onClick={handleReset} title="Reset to Default">
                                    <RotateCcw size={13} /> Reset
                                </button>
                                {snippet.runnable !== false && (
                                    <button
                                        type="button"
                                        className={`${styles.btn} ${styles.runBtn}`}
                                        onClick={handleRun}
                                        disabled={isRunning}
                                        title="Run Code"
                                    >
                                        <Play size={13} /> {isRunning ? 'Running…' : 'Run'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={styles.btn}
                                    onClick={() => setIsExpanded(false)}
                                    title="Minimize Editor"
                                >
                                    <Minimize2 size={13} /> Minimize
                                </button>
                                <button
                                    type="button"
                                    className={styles.closeModalBtn}
                                    onClick={() => setIsExpanded(false)}
                                    title="Close Popup"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.modalBody}>
                            {renderEditorAndOutput(true)}
                        </div>

                        {expected && isMatch && (
                            <div className={`${styles.diffBanner} ${styles.diffMatch}`}>
                                <CheckCircle2 size={16} />
                                <span>Output matches expected output!</span>
                            </div>
                        )}
                        {expected && isMismatch && (
                            <div className={`${styles.diffBanner} ${styles.diffMismatch}`}>
                                <AlertTriangle size={16} />
                                <span>Output differs from expected: <code>"{expected}"</code></span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
