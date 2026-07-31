import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import styles from './MonacoEditorPane.module.css';

interface MonacoEditorPaneProps {
    code: string;
    language: string;
    onChange: (val: string) => void;
    onRun?: () => void;
}

export const MonacoEditorPane: React.FC<MonacoEditorPaneProps> = ({
    code,
    language,
    onChange,
    onRun
}) => {
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

    const handleBeforeMount = (monaco: Monaco) => {
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

    return (
        <div className={styles.editorWrapper}>
            <Editor
                height="100%"
                language={language}
                theme={themeMode === 'light' ? 'learnNowLight' : 'learnNowDark'}
                value={code}
                beforeMount={handleBeforeMount}
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
                onMount={(editor) => {
                    if (onRun) {
                        editor.addCommand(2048 | 3, () => onRun());
                    }
                }}
            />
        </div>
    );
};
