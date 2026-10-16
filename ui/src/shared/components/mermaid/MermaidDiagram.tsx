import React, { useCallback, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import styles from './MermaidDiagram.module.css';

/**
 * Diagram source comes from admin-authored content blocks, including the bulk JSON
 * course importer. 'loose' permits raw HTML in labels and javascript: click handlers,
 * so any content author - or anyone who compromised one admin account - could execute
 * script in every learner's browser. 'strict' is the only safe setting for content we
 * did not author ourselves.
 */
const SECURITY_LEVEL = 'strict' as const;


const FONT_FAMILY = 'Inter, system-ui, -apple-system, sans-serif';
const FONT_SIZE = 15;

// ── Colours come from the page's own theme tokens, so a diagram reads as part of the lesson ──

const token = (name: string, fallback: string): string =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const toRgb = (color: string): [number, number, number] | null => {
    const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
        const h = hex[1].length === 3 ? hex[1].replace(/./g, c => c + c) : hex[1];
        return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
    }
    const rgb = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
};

/** `amount` of `top` over `base`. Mermaid parses plain hex, not color-mix(), so it is done here. */
const mix = (top: string, base: string, amount: number): string => {
    const a = toRgb(top);
    const b = toRgb(base);
    if (!a || !b) return top;
    const c = a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)));
    return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

const initMermaid = () => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const accent = token('--tech-blue', isDark ? '#38bdf8' : '#005995');
    const card = token('--bg-card', isDark ? '#1e293b' : '#ffffff');
    const text = token('--text-primary', isDark ? '#f8fafc' : '#0f172a');
    const muted = token('--text-tertiary', isDark ? '#94a3b8' : '#64748b');
    const border = token('--border-color', isDark ? '#334155' : '#e2e8f0');
    const nodeFill = mix(accent, card, isDark ? 0.16 : 0.08);
    const softFill = mix(accent, card, isDark ? 0.07 : 0.04);

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: SECURITY_LEVEL,
        // 'base' is the only theme that takes every variable below instead of its own palette.
        theme: 'base',
        darkMode: isDark,
        fontFamily: FONT_FAMILY,
        themeVariables: {
            fontSize: `${FONT_SIZE}px`,
            background: 'transparent',
            primaryColor: nodeFill,
            primaryBorderColor: accent,
            primaryTextColor: text,
            secondaryColor: softFill,
            secondaryBorderColor: border,
            secondaryTextColor: text,
            tertiaryColor: softFill,
            tertiaryBorderColor: border,
            tertiaryTextColor: text,
            lineColor: muted,
            textColor: text,
            mainBkg: nodeFill,
            nodeBorder: accent,
            clusterBkg: softFill,
            clusterBorder: border,
            titleColor: text,
            edgeLabelBackground: card,
            // Sequence diagrams
            actorBkg: nodeFill,
            actorBorder: accent,
            actorTextColor: text,
            actorLineColor: border,
            signalColor: muted,
            signalTextColor: text,
            labelBoxBkgColor: nodeFill,
            labelBoxBorderColor: accent,
            labelTextColor: text,
            loopTextColor: text,
            noteBkgColor: softFill,
            noteBorderColor: border,
            noteTextColor: text,
            activationBkgColor: nodeFill,
            activationBorderColor: accent,
            sequenceNumberColor: card
        },
        // Natural size, never scaled down to fit: a shrunk diagram is a diagram nobody can read.
        flowchart: { useMaxWidth: false, curve: 'basis', padding: 14, nodeSpacing: 36, rankSpacing: 44 },
        // Sequence diagrams size their boxes from these, not from the theme's font - left at their
        // defaults (14px, a different typeface) the text renders wider than the box drawn for it.
        // `wrap` is the backstop: a note spanning two participants is as wide as the gap between
        // them, so a long one is wrapped onto lines rather than spilling past its own box.
        sequence: {
            useMaxWidth: false,
            wrap: true,
            mirrorActors: false,
            actorMargin: 60,
            messageMargin: 36,
            actorFontFamily: FONT_FAMILY,
            actorFontSize: FONT_SIZE,
            noteFontFamily: FONT_FAMILY,
            noteFontSize: FONT_SIZE,
            messageFontFamily: FONT_FAMILY,
            messageFontSize: FONT_SIZE
        },
        state: { useMaxWidth: false },
        er: { useMaxWidth: false },
        gitGraph: { useMaxWidth: false }
    });
};

const HORIZONTAL_FLOW = /^(\s*(?:flowchart|graph))\s+(LR|RL)\b/;

/** The same flowchart drawn top-to-bottom, or null when the diagram is not a horizontal flowchart. */
const asVertical = (chart: string): string | null =>
    HORIZONTAL_FLOW.test(chart) ? chart.replace(HORIZONTAL_FLOW, '$1 TB') : null;

/** The width a rendered diagram wants, from its viewBox - it is drawn at natural size, never scaled. */
const naturalWidth = (svg: string): number => {
    const m = svg.match(/viewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
};

/** Room for the diagram inside its container, padding excluded. */
const availableWidth = (el: HTMLElement | null): number => {
    if (!el) return window.innerWidth;
    const cs = getComputedStyle(el);
    const width = el.clientWidth || el.parentElement?.clientWidth || window.innerWidth;
    return width - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
};

interface MermaidDiagramProps {
    chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    // A horizontal flowchart is drawn across when it fits the column and down when it does not.
    // `fit` records the width the across version needs and whether it was used, so a resize only
    // redraws when it would change that decision.
    const [layoutEpoch, setLayoutEpoch] = useState(0);
    const fit = useRef<{ needs: number; across: boolean } | null>(null);
    // Bumped when the app switches theme, so the diagram is redrawn in the new colours.
    const [themeVersion, setThemeVersion] = useState(0);
    // A diagram wider than the column scrolls; these say which edges have more beyond them.
    const [more, setMore] = useState({ left: false, right: false });

    const measureOverflow = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setMore({ left: el.scrollLeft > 2, right: max - el.scrollLeft > 2 });
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(entries => {
            const width = entries[0]?.contentRect.width ?? 0;
            if (width > 0 && fit.current) {
                const across = fit.current.needs <= availableWidth(el);
                if (across !== fit.current.across) setLayoutEpoch(e => e + 1);
            }
            measureOverflow();
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [measureOverflow]);

    // A new drawing has a new width, so where the fades belong is only known once it is in the page.
    useEffect(() => {
        measureOverflow();
    }, [svg, measureOverflow]);

    useEffect(() => {
        if (typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(() => setThemeVersion(v => v + 1));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let isMounted = true;
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;

        const renderChart = async () => {
            try {
                setError(null);
                initMermaid();
                const source = chart.trim();
                let { svg: rendered } = await mermaid.render(id, source);
                // Measured at the moment of drawing rather than kept from an earlier resize event:
                // the lesson re-creates this component as it scrolls, and that state does not survive.
                const vertical = asVertical(source);
                if (vertical) {
                    const needs = naturalWidth(rendered);
                    const across = needs <= availableWidth(containerRef.current);
                    fit.current = { needs, across };
                    if (!across) ({ svg: rendered } = await mermaid.render(`${id}-down`, vertical));
                } else {
                    fit.current = null;
                }
                if (isMounted) setSvg(rendered);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                if (isMounted) setError(msg || 'Failed to render Mermaid diagram');
            }
        };

        renderChart();
        return () => {
            isMounted = false;
        };
    }, [chart, layoutEpoch, themeVersion]);

    if (error) {
        return (
            <div className={styles.mermaidFallback}>
                <pre className={styles.mermaidPre}>
                    <code>{chart}</code>
                </pre>
            </div>
        );
    }

    return (
        <figure
            className={[
                styles.mermaidWrapper,
                more.left ? styles.moreLeft : '',
                more.right ? styles.moreRight : ''
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div
                className={styles.mermaidSvgContainer}
                ref={containerRef}
                role="img"
                aria-label="Diagram"
                tabIndex={more.left || more.right ? 0 : undefined}
                onScroll={measureOverflow}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
            {more.right && (
                <span className={styles.scrollHint} aria-hidden="true">
                    Scroll for more →
                </span>
            )}
        </figure>
    );
};

export default MermaidDiagram;
