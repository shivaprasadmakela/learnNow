import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco, OnMount } from '@monaco-editor/react';
import styles from './MonacoEditorPane.module.css';

interface MonacoEditorPaneProps {
    code: string;
    language: string;
    onChange: (val: string) => void;
    onRun?: () => void;
    onMountEditor?: (editor: any) => void;
}

export const MonacoEditorPane: React.FC<MonacoEditorPaneProps> = ({
    code,
    language,
    onChange,
    onRun,
    onMountEditor
}) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);

    const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
        if (typeof document !== 'undefined') {
            const attr = document.documentElement.getAttribute('data-theme');
            return attr === 'light' ? 'light' : 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const observer = new MutationObserver(() => {
            const attr = document.documentElement.getAttribute('data-theme');
            setThemeMode(attr === 'light' ? 'light' : 'dark');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    // Keep Monaco model language strictly synchronized on language switch
    useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                monacoRef.current.editor.setModelLanguage(model, language);
            }
            editorRef.current.layout();
        }
    }, [language]);

    const handleBeforeMount = (monaco: Monaco) => {
        // Prevent false semantic diagnostic errors on JS/TS
        if (monaco.languages.typescript) {
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: false
            });
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: false
            });
        }

        // Dark Theme
        monaco.editor.defineTheme('learnNowDark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
                { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
                { token: 'string', foreground: '34d399' },
                { token: 'number', foreground: 'fbbf24' },
                { token: 'function', foreground: '818cf8' },
                { token: 'variable', foreground: 'f8fafc' }
            ],
            colors: {
                'editor.background': '#0f172a',
                'editor.foreground': '#f8fafc',
                'editor.lineHighlightBackground': '#1e293b',
                'editorLineNumber.foreground': '#475569',
                'editorLineNumber.activeForeground': '#38bdf8',
                'editorCursor.foreground': '#38bdf8',
                'editorIndentGuide.background': '#1e293b'
            }
        });

        // Light Theme
        monaco.editor.defineTheme('learnNowLight', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
                { token: 'keyword', foreground: '0284c7', fontStyle: 'bold' },
                { token: 'string', foreground: '059669' },
                { token: 'number', foreground: 'd97706' },
                { token: 'function', foreground: '4f46e5' },
                { token: 'variable', foreground: '0f172a' }
            ],
            colors: {
                'editor.background': '#ffffff',
                'editor.foreground': '#0f172a',
                'editor.lineHighlightBackground': '#f1f5f9',
                'editorLineNumber.foreground': '#94a3b8',
                'editorLineNumber.activeForeground': '#0284c7',
                'editorCursor.foreground': '#0284c7',
                'editorIndentGuide.background': '#e2e8f0'
            }
        });
    };

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        if (onRun) {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun());
        }
        if (onMountEditor) {
            onMountEditor(editor);
        }
    };

    return (
        <div className={styles.editorWrapper}>
            <Editor
                height="100%"
                language={language}
                theme={themeMode === 'light' ? 'learnNowLight' : 'learnNowDark'}
                value={code}
                beforeMount={handleBeforeMount}
                onMount={handleMount}
                onChange={(val) => onChange(val || '')}
                options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    padding: { top: 14, bottom: 14 }
                }}
            />
        </div>
    );
};
