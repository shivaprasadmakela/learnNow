import React, { useState } from 'react';
import { MonacoEditorPane } from '../../../features/compiler/components/MonacoEditorPane/MonacoEditorPane';
import { CompilerOutputPane } from '../../../features/compiler/components/CompilerOutputPane/CompilerOutputPane';
import { useCodeExecution } from '../../../features/compiler/hooks/useCodeExecution';
import { Play, RotateCcw, Copy, Check } from 'lucide-react';
import styles from './CodePlayground.module.css';

export interface CodePlaygroundProps {
    initialCode: string;
    language?: string;
    title?: string;
    onCodeChange?: (code: string) => void;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
    initialCode,
    language = 'javascript',
    title = 'VS Code Monaco Compiler',
    onCodeChange
}) => {
    const [code, setCode] = useState<string>(initialCode);
    const [stdin, setStdin] = useState<string>('');
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const { logs, htmlPreview, isRunning, executionTimeMs, runCode, clearConsole } = useCodeExecution();

    const handleRun = () => {
        runCode(code, language, stdin);
    };

    const handleReset = () => {
        setCode(initialCode);
        clearConsole();
        if (onCodeChange) onCodeChange(initialCode);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={styles.playgroundCard}>
            <div className={styles.playgroundHeader}>
                <span className={styles.playgroundTitle}>⚡ {title} ({language})</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className={styles.btn} onClick={handleCopy} title="Copy code">
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        {isCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button type="button" className={styles.btn} onClick={handleReset} title="Reset template">
                        <RotateCcw size={13} /> Reset
                    </button>
                    <button type="button" className={`${styles.btn} ${styles.runBtn}`} onClick={handleRun} disabled={isRunning} title="Run Code">
                        <Play size={13} /> {isRunning ? 'Running…' : 'Run'}
                    </button>
                </div>
            </div>

            <div className={styles.splitBody}>
                <div className={styles.editorBox}>
                    <MonacoEditorPane
                        code={code}
                        language={language}
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
                        isHtml={language === 'html'}
                    />
                </div>
            </div>
        </div>
    );
};
