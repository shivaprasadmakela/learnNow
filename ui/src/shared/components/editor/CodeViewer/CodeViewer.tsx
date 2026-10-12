import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { HighlightToken } from '../highlightCode';
import styles from './CodeViewer.module.css';

export interface CodeViewerProps {
    code: string;
    /** A Monaco language id (`java`, `python`, `cpp`, `javascript`...). Drives highlighting only. */
    language: string;
    /** Rendered at the left of the header - a language switcher, usually. */
    toolbar?: React.ReactNode;
    /** Names the code region for screen readers, e.g. "Optimal approach in Java". */
    label?: string;
}

/**
 * A read-only, syntax-highlighted code block with line numbers and a copy button.
 *
 * This is for reading code, not running it. A runnable playground is the wrong tool for a
 * solution fragment like `class Solution { ... }`: it has no entry point, so "Run" could only ever
 * fail. Highlighting arrives a beat after the first paint (the grammar is loaded on demand); until
 * then, and if it ever fails, the code shows as plain text rather than not at all.
 */
export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language, toolbar, label }) => {
    const [highlighted, setHighlighted] = useState<{
        key: string;
        lines: HighlightToken[][];
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const key = `${language}\u0000${code}`;

    useEffect(() => {
        let cancelled = false;
        import('../highlightCode')
            .then(module => module.tokenizeLines(code, language))
            .then(lines => {
                if (!cancelled) setHighlighted({ key, lines });
            })
            .catch(() => {
                /* Plain text is an acceptable fallback; nothing to surface. */
            });
        return () => {
            cancelled = true;
        };
    }, [code, language, key]);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 1800);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const lines = useMemo<HighlightToken[][]>(
        () =>
            highlighted?.key === key
                ? highlighted.lines
                : code.split('\n').map(text => [{ text, kind: 'plain' as const }]),
        [highlighted, key, code]
    );

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <figure className={styles.viewer} aria-label={label}>
            <div className={styles.header}>
                <div className={styles.toolbar}>{toolbar}</div>
                <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={handleCopy}
                    aria-label={copied ? 'Code copied' : 'Copy code'}
                >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            <div className={styles.scroller} tabIndex={0} role="region" aria-label={label ?? 'Code'}>
                <pre className={styles.pre}>
                    <code>
                        {lines.map((tokens, lineIndex) => (
                            <span key={lineIndex} className={styles.line}>
                                <span className={styles.lineNumber} aria-hidden="true">
                                    {lineIndex + 1}
                                </span>
                                <span className={styles.lineText}>
                                    {tokens.map((token, tokenIndex) =>
                                        token.kind === 'plain' ? (
                                            <React.Fragment key={tokenIndex}>
                                                {token.text}
                                            </React.Fragment>
                                        ) : (
                                            <span key={tokenIndex} className={styles[token.kind]}>
                                                {token.text}
                                            </span>
                                        )
                                    )}
                                    {'\n'}
                                </span>
                            </span>
                        ))}
                    </code>
                </pre>
            </div>
        </figure>
    );
};

export default CodeViewer;
