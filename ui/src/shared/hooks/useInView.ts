import { useEffect, useRef, useState } from 'react';
import { MEDIA, useMediaQuery } from './useMediaQuery';

export interface UseInViewOptions {
    /** Stop observing after the first entry. The default — a reveal should not re-run on scroll-up. */
    once?: boolean;
    /** Shrinks the trigger area so a section reveals as it rises into view, not the moment its top edge appears. */
    rootMargin?: string;
    threshold?: number;
}

/**
 * Tells a component whether it is on screen.
 *
 * The landing page uses it for two things that both have to be cheap: revealing a section as it
 * scrolls in, and starting an animation (a counter, an auto-advancing tour) only once the thing
 * being animated is actually being looked at. Both would otherwise run on mount, off screen,
 * and be over before anyone saw them.
 *
 * IntersectionObserver rather than scroll listeners on purpose: the work happens off the main
 * thread, and `root: null` measures against the viewport with ancestor clipping applied, so it
 * still works inside the app's nested scroll container.
 */
export const useInView = <T extends HTMLElement = HTMLDivElement>({
    once = true,
    rootMargin = '0px 0px -10% 0px',
    threshold = 0.15
}: UseInViewOptions = {}) => {
    const ref = useRef<T | null>(null);
    // No observer (old browser, jsdom in the unit tests): start visible rather than hide the
    // content behind an event that will never fire. Decided at first render so the content is
    // never hidden even for a frame.
    const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        if (typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setInView(true);
                        if (once) observer.disconnect();
                    } else if (!once) {
                        setInView(false);
                    }
                }
            },
            { rootMargin, threshold }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [once, rootMargin, threshold]);

    return [ref, inView] as const;
};

/**
 * Whether the visitor has asked for less motion.
 *
 * Everything animated on the landing page checks this. Reveals become instant, the rotating
 * headline word stops rotating and the tour stops advancing by itself — the content is identical
 * either way, which is the point.
 *
 * A named reading of the shared media-query hook rather than its own listener: the query is in
 * MEDIA with the breakpoints, so there is one place where it is written down.
 */
export const usePrefersReducedMotion = (): boolean => useMediaQuery(MEDIA.reducedMotion);
