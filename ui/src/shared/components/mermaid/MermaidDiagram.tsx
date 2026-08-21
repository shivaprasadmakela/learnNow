import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import styles from './MermaidDiagram.module.css';

/**
 * Diagram source comes from admin-authored content blocks, including the bulk JSON
 * course importer. 'loose' permits raw HTML in labels and javascript: click handlers,
 * so any content author - or anyone who compromised one admin account - could execute
 * script in every learner's browser. 'strict' is the only safe setting for content we
 * did not author ourselves.
 */
const initMermaid = (theme: 'dark' | 'default') =>
    mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: 'strict',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    });

/** Reads the theme the app is currently rendering in, so diagrams match the page. */
const currentMermaidTheme = (): 'dark' | 'default' =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark';

interface MermaidDiagramProps {
    chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;

        const renderChart = async () => {
            try {
                setError(null);
                initMermaid(currentMermaidTheme());
                const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
                if (isMounted) {
                    setSvg(renderedSvg);
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                if (isMounted) {
                    setError(msg || 'Failed to render Mermaid diagram');
                }
            }
        };

        renderChart();

        return () => {
            isMounted = false;
        };
    }, [chart]);

    if (error) {
        return (
            <div className={styles.mermaidFallback}>
                <div className={styles.mermaidHeader}>
                    <span className={styles.mermaidBadge}>Mermaid Diagram Syntax</span>
                </div>
                <pre className={styles.mermaidPre}>
                    <code>{chart}</code>
                </pre>
            </div>
        );
    }

    return (
        <div className={styles.mermaidWrapper}>
            <div className={styles.mermaidHeader}>
                <span className={styles.mermaidBadge}>
                    <i className="fa-solid fa-diagram-project" style={{ marginRight: '6px' }} aria-hidden="true" />
                    Architecture / Flow Diagram
                </span>
            </div>
            <div
                className={styles.mermaidSvgContainer}
                ref={containerRef}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
};

export default MermaidDiagram;
