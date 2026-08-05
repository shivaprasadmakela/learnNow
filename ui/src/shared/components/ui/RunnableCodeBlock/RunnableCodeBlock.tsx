import React, { useState } from 'react';
import { MonacoEditorPane } from '../../../../features/compiler/components/MonacoEditorPane/MonacoEditorPane';
import { CompilerOutputPane } from '../../../../features/compiler/components/CompilerOutputPane/CompilerOutputPane';
import { useCodeExecution } from '../../../../features/compiler/hooks/useCodeExecution';
import { Play, RotateCcw, Copy, Check, CheckCircle2, AlertTriangle } from 'lucide-react';
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

    return (
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
                </div>
            </div>

            <div className={styles.splitBody}>
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
    );
};
