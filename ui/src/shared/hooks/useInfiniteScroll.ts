import { useEffect, useRef, useState } from 'react';

export interface UseInfiniteScrollOptions {
    /** Whether the server reported another page after the one already loaded. */
    hasMore: boolean;
    /** True while a page is in flight, so the observer does not queue duplicate loads. */
    isLoading: boolean;
    onLoadMore: () => void;
    /** Scroll container to watch. Leave undefined for the viewport; pass the element for a modal. */
    root?: Element | null;
    /** How far ahead of the sentinel to start loading. */
    rootMargin?: string;
}

/**
 * Returns a ref callback to attach to a sentinel element at the end of a list. When that sentinel
 * scrolls into view, the next page is requested.
 *
 * The sentinel is held in state rather than a ref object so the observer is (re)attached the
 * moment the element mounts - a plain ref does not re-run the effect when its contents change,
 * which silently breaks the first page of a list that renders its sentinel conditionally.
 *
 * Re-observing after each load is deliberate: when a filtered list is shorter than the viewport
 * the sentinel stays visible, so pages keep arriving until the server says there are none left,
 * instead of the user staring at three results with no way to scroll for more.
 */
export const useInfiniteScroll = ({
    hasMore,
    isLoading,
    onLoadMore,
    root = null,
    rootMargin = '240px'
}: UseInfiniteScrollOptions) => {
    const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

    // Held in a ref so a caller passing a fresh closure each render does not tear down and
    // rebuild the observer, which would re-fire the moment it reattached.
    const onLoadMoreRef = useRef(onLoadMore);
    useEffect(() => {
        onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        if (!sentinel || !hasMore || isLoading) return;
        if (typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    onLoadMoreRef.current();
                }
            },
            { root, rootMargin, threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [sentinel, hasMore, isLoading, root, rootMargin]);

    return setSentinel;
};

export default useInfiniteScroll;
