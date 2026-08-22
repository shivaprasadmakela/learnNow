import React from 'react';
import styles from './InfiniteScrollSentinel.module.css';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

export interface InfiniteScrollSentinelProps {
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    /** Scroll container, for lists inside a modal or a pane rather than the page itself. */
    root?: Element | null;
    loadingText?: string;
    /** Shown once everything is loaded. Omit to render nothing at the end of the list. */
    endText?: string;
    /** Rendered when the observer is unavailable, and as a manual fallback for keyboard users. */
    loadMoreLabel?: string;
}

/**
 * End-of-list marker that pulls the next page as it scrolls into view.
 *
 * The button is not decoration: it is the fallback for browsers without IntersectionObserver, and
 * it gives keyboard and screen-reader users a way to reach page two, which a scroll-only trigger
 * never offers them.
 */
export const InfiniteScrollSentinel: React.FC<InfiniteScrollSentinelProps> = ({
    hasMore,
    isLoading,
    onLoadMore,
    root = null,
    loadingText = 'Loading more...',
    endText,
    loadMoreLabel = 'Load more'
}) => {
    const sentinelRef = useInfiniteScroll({ hasMore, isLoading, onLoadMore, root });

    if (!hasMore) {
        return endText ? <div className={styles.sentinel}><span className={styles.endText}>{endText}</span></div> : null;
    }

    return (
        <div ref={sentinelRef} className={styles.sentinel} aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
                <>
                    <span className={styles.spinner} aria-hidden="true" />
                    <span>{loadingText}</span>
                </>
            ) : (
                <button type="button" className={styles.endText} onClick={onLoadMore}>
                    {loadMoreLabel}
                </button>
            )}
        </div>
    );
};

export default InfiniteScrollSentinel;
