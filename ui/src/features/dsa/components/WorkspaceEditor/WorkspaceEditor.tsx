import React, { useEffect, useMemo, useRef } from 'react';
import { Play, RotateCcw, Send, X, Plus, Maximize2 } from 'lucide-react';
import styles from './WorkspaceEditor.module.css';
import { MonacoEditorPane } from '../../../../shared/components/editor/MonacoEditorPane/MonacoEditorPane';
import { SUPPORTED_LANGUAGES } from '../../../../shared/components/editor/codeTemplates';
import { useEditorTabs } from '../../hooks/useEditorTabs';
import type { DsaHarnessStub } from '../../api/dsa.api';

export interface WorkspaceEditorProps {
    problemSlug: string;
    harnesses: DsaHarnessStub[];
    language: string;
    onLanguageChange: (language: string) => void;
    judgeable: boolean;
    isBusy: boolean;
    onRun: (code: string) => void;
    onSubmit: (code: string) => void;
    onOpenFullCompiler?: (code: string, language: string) => void;
}

/**
 * The code half of the workspace.
 *
 * `MonacoEditorPane` is mounted exactly as the standalone console mounts it — same theme observer,
 * same Ctrl/Cmd+Enter binding, no fork. What this adds is the language picker constrained to the
 * languages this problem actually has a harness for, the scratch tabs, and the Run/Submit pair.
 */
export const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({
    problemSlug,
    harnesses,
    language,
    onLanguageChange,
    judgeable,
    isBusy,
    onRun,
    onSubmit,
    onOpenFullCompiler
}) => {
    const harness = useMemo(
        () => harnesses.find(h => h.language.toLowerCase() === language.toLowerCase()),
        [harnesses, language]
    );

    const starterCode = harness?.starterCode ?? '';

    const {
        tabs,
        activeTab,
        activeId,
        canAddTab,
        setActiveId,
        setCode,
        addTab,
        closeTab,
        resetActive
    } = useEditorTabs(problemSlug, language, starterCode);

    /**
     * Monaco language id, which is not always the same string as our language id (the console's own
     * table is the source of truth for that mapping).
     */
    const monacoLanguage = useMemo(() => {
        const match = SUPPORTED_LANGUAGES.find(l => l.id === language);
        return match?.monacoLanguage ?? language;
    }, [language]);

    /**
     * Ctrl/Cmd+Enter is bound inside the editor pane at mount, so its callback closes over whatever
     * code existed then. Keeping the latest in a ref means the shortcut always runs what is on
     * screen rather than the starter stub.
     */
    const latestCode = useRef(activeTab?.code ?? '');
    useEffect(() => {
        latestCode.current = activeTab?.code ?? '';
    }, [activeTab?.code]);

    const codeOf = () => latestCode.current;

    if (harnesses.length === 0) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.notice}>
                    No coding harness for this problem yet, so there is nothing to run here. Read the
                    walkthrough, solve it on the judge, and tick it off when you are done.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <select
                    className={styles.select}
                    value={language}
                    onChange={e => onLanguageChange(e.target.value)}
                    aria-label="Language"
                >
                    {harnesses.map(item => {
                        const known = SUPPORTED_LANGUAGES.find(l => l.id === item.language);
                        return (
                            <option key={item.language} value={item.language}>
                                {known?.name ?? item.language}
                            </option>
                        );
                    })}
                </select>

                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={resetActive}
                    title="Reset this tab to the starter code"
                    aria-label="Reset to starter code"
                >
                    <RotateCcw size={14} />
                </button>

                {onOpenFullCompiler && (
                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => onOpenFullCompiler(codeOf(), language)}
                        title="Open in the full console"
                        aria-label="Open in the full console"
                    >
                        <Maximize2 size={14} />
                    </button>
                )}

                <div className={styles.spacer} />

                <button
                    type="button"
                    className={styles.runBtn}
                    onClick={() => onRun(codeOf())}
                    disabled={isBusy || !judgeable}
                    title={judgeable ? 'Run against the examples' : 'This problem has no test cases yet'}
                >
                    <Play size={14} /> Run
                </button>
                <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={() => onSubmit(codeOf())}
                    disabled={isBusy || !judgeable}
                    title={judgeable ? 'Run against every test case' : 'This problem has no test cases yet'}
                >
                    <Send size={14} /> Submit
                </button>
            </div>

            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <span
                        key={tab.id}
                        className={`${styles.tab} ${tab.id === activeId ? styles.tabActive : ''}`}
                    >
                        <button
                            type="button"
                            className={styles.tab}
                            style={{ padding: 0, border: 'none', background: 'none' }}
                            onClick={() => setActiveId(tab.id)}
                        >
                            {tab.label}
                        </button>
                        {tabs.length > 1 && (
                            <button
                                type="button"
                                className={styles.tabClose}
                                onClick={() => closeTab(tab.id)}
                                aria-label={`Close ${tab.label}`}
                            >
                                <X size={11} />
                            </button>
                        )}
                    </span>
                ))}
                {canAddTab && (
                    <button
                        type="button"
                        className={styles.addTab}
                        onClick={addTab}
                        aria-label="New scratch tab"
                        title="New scratch tab"
                    >
                        <Plus size={13} />
                    </button>
                )}
            </div>

            <div className={styles.editor}>
                <MonacoEditorPane
                    code={activeTab?.code ?? ''}
                    language={monacoLanguage}
                    onChange={setCode}
                    onRun={() => !isBusy && judgeable && onRun(codeOf())}
                />
            </div>
        </div>
    );
};

export default WorkspaceEditor;
