import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../CodeBlock';
import styles from './Markdown.module.css';

export interface MarkdownProps {
    content: string;
    /** False where code is for reading only, such as a problem statement. */
    runnableCode?: boolean;
    /** Opens code somewhere else, like the study console's side panel; otherwise inline. */
    onTryInPlayground?: (code: string, language: string) => void;
    onOpenFullCompiler?: (code: string, language: string) => void;
    className?: string;
}

/**
 * Written content - GitHub-flavoured Markdown with fenced code shown by the shared CodeBlock, so a
 * diagram, a copy button and "Try in Playground" behave the same wherever text is shown.
 */
export const Markdown: React.FC<MarkdownProps> = ({
    content,
    runnableCode = true,
    onTryInPlayground,
    onOpenFullCompiler,
    className = ''
}) => {
    if (!content) return null;
    return (
        <div className={`${styles.markdown} ${className}`.trim()}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
                    h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
                    h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
                    h4: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
                    img: ({ src, alt }) => (
                        <span className={styles.figure}>
                            <img src={src} alt={alt || ''} className={styles.image} loading="lazy" />
                            {alt && <span className={styles.caption}>{alt}</span>}
                        </span>
                    ),
                    table: ({ children }) => (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>{children}</table>
                        </div>
                    ),
                    code(props: React.ComponentPropsWithoutRef<'code'> & { node?: unknown }) {
                        const { className: fence, children, ...rest } = props;
                        if (!fence) {
                            return <code className="inline-code" {...rest}>{children}</code>;
                        }
                        const lang = /language-(\S+)/.exec(fence)?.[1] ?? '';
                        return (
                            <CodeBlock
                                code={String(children || '').replace(/\n$/, '')}
                                lang={lang}
                                runnable={runnableCode}
                                onTryInPlayground={onTryInPlayground}
                                onOpenFullCompiler={onOpenFullCompiler}
                            />
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default Markdown;
