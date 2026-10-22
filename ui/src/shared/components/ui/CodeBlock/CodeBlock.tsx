import React, { useState } from 'react';
import { Check, Code, Copy, Terminal } from 'lucide-react';
import { playgroundLanguage } from '../../../utils/codeWrapper';
import styles from './CodeBlock.module.css';

/**
 * Lazy, both of them: mermaid is ~3 MB minified and the playground mounts Monaco, and most blocks
 * need neither. Imported eagerly, every page that shows text would load both up front.
 */
const MermaidDiagram = React.lazy(() =>
    import('../../mermaid').then(m => ({ default: m.MermaidDiagram }))
);
const CodePlayground = React.lazy(() =>
    import('../../code-playground').then(m => ({ default: m.CodePlayground }))
);

export interface CodeBlockProps {
    code: string;
    /** The fence's language: "java", "sql", "mermaid"... */
    lang?: string;
    /** False where code is shown for reading only, such as a problem statement. */
    runnable?: boolean;
    /**
     * Opens the code somewhere else - the study console's side panel. Without it, the playground
     * opens inline beneath the code.
     */
    onTryInPlayground?: (code: string, language: string) => void;
    /** Passed to an inline playground's "Full editor" button. */
    onOpenFullCompiler?: (code: string, language: string) => void;
}

/**
 * One fenced block of code in written content: a diagram for mermaid, otherwise the code with
 * Copy, and "Try in Playground" for code that is a whole program (see playgroundLanguage).
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
    code,
    lang = '',
    runnable = true,
    onTryInPlayground,
    onOpenFullCompiler
}) => {
    const [copied, setCopied] = useState(false);
    const [inlineOpen, setInlineOpen] = useState(false);
    const cleanLang = lang.trim().toLowerCase();

    if (cleanLang === 'mermaid') {
        return (
            <React.Suspense fallback={<div className={styles.loading}>Loading diagram…</div>}>
                <MermaidDiagram chart={code} />
            </React.Suspense>
        );
    }

    const language = runnable ? playgroundLanguage(code, cleanLang) : null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            return; // No clipboard (an http origin) or permission refused: nothing was copied.
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTry = () => {
        if (!language) return;
        if (onTryInPlayground) onTryInPlayground(code, language);
        else setInlineOpen(open => !open);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <span className={styles.lang}>
                    <Code size={13} aria-hidden="true" />
                    {cleanLang ? cleanLang.toUpperCase() : 'CODE'}
                </span>
                <div className={styles.actions}>
                    <button type="button" className={styles.copyBtn} onClick={handleCopy} title="Copy code">
                        {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    {language && (
                        <button
                            type="button"
                            className={`${styles.tryBtn} ${inlineOpen ? styles.tryBtnActive : ''}`.trim()}
                            onClick={handleTry}
                            aria-expanded={onTryInPlayground ? undefined : inlineOpen}
                        >
                            <Terminal size={13} aria-hidden="true" />
                            <span>{inlineOpen ? 'Hide playground' : 'Try in Playground'}</span>
                        </button>
                    )}
                </div>
            </div>

            {inlineOpen && language ? (
                <React.Suspense fallback={<div className={styles.loading}>Loading playground…</div>}>
                    <CodePlayground initialCode={code} language={language} onOpenFullEditor={onOpenFullCompiler} />
                </React.Suspense>
            ) : (
                <pre className={styles.pre}>
                    <code>{code}</code>
                </pre>
            )}
        </div>
    );
};

export default CodeBlock;
