import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2, Play, RotateCcw, Send, Sparkles } from 'lucide-react';
import styles from './WorkspaceEditor.module.css';
import { MonacoEditorPane } from '../../../../shared/components/editor/MonacoEditorPane/MonacoEditorPane';
import { DSA_SUPPORTED_LANGUAGES, getStarterCode } from '../../utils/dsaExecutionHelper';
import { useCodeBuffer } from '../../hooks/useCodeBuffer';
import type { DsaHarnessStub, DsaProblemDetail } from '../../api/dsa.api';

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
    problemDetail?: DsaProblemDetail;
}

/**
 * The code half of the workspace.
 *
 * Single-buffer editor supporting standard languages with JavaScript as default,
 * complete with Prettier code formatter, reset, and fullscreen controls.
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
    onOpenFullCompiler: _onOpenFullCompiler,
    problemDetail
}) => {
    const editorRef = useRef<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const starterCode = useMemo(() => {
        if (problemDetail) {
            return getStarterCode(problemDetail, language);
        }
        const h = harnesses.find(item => item.language.toLowerCase() === language.toLowerCase());
        return h?.starterCode ?? `// Write your ${language} solution here\n`;
    }, [problemDetail, harnesses, language]);

    const { code, setCode, resetCode } = useCodeBuffer(problemSlug, language, starterCode);

    const monacoLanguage = useMemo(() => {
        const match = DSA_SUPPORTED_LANGUAGES.find(l => l.id.toLowerCase() === language.toLowerCase());
        return match?.monacoLanguage ?? language;
    }, [language]);

    const latestCode = useRef(code);
    useEffect(() => {
        latestCode.current = code;
    }, [code]);

    const codeOf = () => latestCode.current;

    const handleFormat = () => {
        if (editorRef.current) {
            editorRef.current.getAction('editor.action.formatDocument')?.run();
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <select
                    className={styles.select}
                    value={language}
                    onChange={e => onLanguageChange(e.target.value)}
                    aria-label="Language"
                >
                    {DSA_SUPPORTED_LANGUAGES.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={handleFormat}
                    title="Prettify / Format Code (Shift + Alt + F)"
                    aria-label="Format Code"
                >
                    <Sparkles size={14} />
                </button>

                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={resetCode}
                    title="Reset to starter code"
                    aria-label="Reset to starter code"
                >
                    <RotateCcw size={14} />
                </button>

                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
                    aria-label="Toggle Fullscreen"
                >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

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

            <div className={styles.editor}>
                <MonacoEditorPane
                    code={code}
                    language={monacoLanguage}
                    onChange={setCode}
                    onRun={() => !isBusy && judgeable && onRun(codeOf())}
                    onMountEditor={ed => {
                        editorRef.current = ed;
                    }}
                />
            </div>
        </div>
    );
};

export default WorkspaceEditor;
