import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query from JavaScript.
 *
 * For the cases where a breakpoint has to change *behaviour*, not just styling — a layout that
 * becomes one pane at a time rather than three side by side needs a switcher control that does not
 * exist on desktop, and no amount of CSS conjures a component into being.
 *
 * Prefer plain CSS wherever the difference is only visual: this re-renders on resize, and a
 * media query in a stylesheet does not.
 */
export const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const list = window.matchMedia(query);
        // Read once on mount as well as on change: the query may already differ from the initial
        // state if this mounted during a resize, or was server-rendered.
        setMatches(list.matches);

        const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
        list.addEventListener('change', onChange);
        return () => list.removeEventListener('change', onChange);
    }, [query]);

    return matches;
};

/**
 * The app's breakpoints, as behaviour-level queries.
 *
 * Mirrors the scale documented in styles/tokens/breakpoints.css. Named rather than inlined so a
 * component asking "am I on a phone" does not hardcode a number that then drifts from the CSS.
 */
export const MEDIA = {
    /** Below the sidebar's off-canvas breakpoint: assume one hand and one column. */
    mobile: '(max-width: 768px)',
    /** Tablet and below — where side-by-side panes stop earning their keep. */
    compact: '(max-width: 1024px)',
    /** A touch pointer, whatever the width. */
    touch: '(pointer: coarse)'
} as const;

export const useIsMobile = () => useMediaQuery(MEDIA.mobile);

export default useMediaQuery;
