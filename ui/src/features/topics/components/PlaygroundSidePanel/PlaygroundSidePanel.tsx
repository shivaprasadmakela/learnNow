import React, { useState, useEffect } from 'react';
import { X, Play, RotateCcw, Copy, Check, ExternalLink, Terminal } from 'lucide-react';
import { MonacoEditorPane } from '../../../../shared/components/editor/MonacoEditorPane/MonacoEditorPane';
import { CompilerOutputPane } from '../../../../shared/components/editor/CompilerOutputPane/CompilerOutputPane';
import { useCodeExecution } from '../../../../shared/components/editor/useCodeExecution';
import styles from './PlaygroundSidePanel.module.css';

interface PlaygroundSidePanelProps {
    isOpen: boolean;
    initialCode: string;
    language: string;
    onClose: () => void;
    onOpenFullCompiler?: (code: string, language: string) => void;
}

export const PlaygroundSidePanel: React.FC<PlaygroundSidePanelProps> = ({
    isOpen,
    initialCode,
    language,
    onClose,
    onOpenFullCompiler
}) => {
    const [code, setCode] = useState<string>(initialCode);
    const [stdin, setStdin] = useState<string>('');
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const { logs, htmlPreview, isRunning, executionTimeMs, runCode, clearConsole } = useCodeExecution();

    useEffect(() => {
        if (isOpen) {
            setCode(initialCode);
            clearConsole();
        }
    }, [isOpen, initialCode, clearConsole]);

    const handleRun = () => {
        runCode(code, language, stdin);
    };

    const handleReset = () => {
        setCode(initialCode);
        clearConsole();
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenFull = () => {
        if (onOpenFullCompiler) {
            onOpenFullCompiler(code, language);
        } else if (typeof window !== 'undefined') {
            const langId = language.toLowerCase() === 'javascript' ? 'js' : language.toLowerCase();
            localStorage.setItem(`compiler_draft_${langId}`, code);
            window.location.href = `/compiler/${langId}`;
        }
    };

    return (
        <aside
            className={`${styles.playgroundSideSlider} ${isOpen ? styles.playgroundSideSliderOpen : ''}`}
            aria-label="Code Playground Side Panel"
        >
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Terminal size={18} style={{ color: '#3b82f6' }} />
                    <span>Code Playground</span>
                    <span className={styles.langBadge}>{language.toUpperCase()}</span>
                </div>

                <div className={styles.headerActions}>
                    <button type="button" className={styles.iconBtn} onClick={handleCopy} title="Copy code">
                        {isCopied ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={handleOpenFull} title="Open full screen editor">
                        <ExternalLink size={14} />
                    </button>
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Close Playground">
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className={styles.body}>
                <div className={styles.toolbar}>
                    <button type="button" className={styles.toolBtn} onClick={handleReset} title="Reset code">
                        <RotateCcw size={13} /> Reset
                    </button>
                    <button type="button" className={styles.toolBtnFull} onClick={handleOpenFull} title="Full screen editor">
                        <ExternalLink size={13} /> Full Editor ↗
                    </button>
                    <button
                        type="button"
                        className={styles.runBtn}
                        onClick={handleRun}
                        disabled={isRunning}
                        title="Run Code"
                    >
                        <Play size={13} /> {isRunning ? 'Running…' : 'Run Code'}
                    </button>
                </div>

                <div className={styles.editorContainer}>
                    <MonacoEditorPane
                        code={code}
                        language={language === 'js' ? 'javascript' : language}
                        onChange={setCode}
                        onRun={handleRun}
                    />
                </div>

                <div className={styles.outputContainer}>
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
        </aside>
    );
};
