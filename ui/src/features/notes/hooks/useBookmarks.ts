import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    fetchBookmarksApi,
    toggleBookmarkApi,
    type BookmarkDto,
    type NoteTarget
} from '../api/notes.api';

/**
 * The learner's bookmarks, of every kind.
 *
 * `target` defaults to TOPIC so existing callers - the topic cards and the study console - keep
 * working untouched. The DSA sheet passes DSA_PROBLEM.
 */
export function useBookmarks(isLoggedIn: boolean = true, target: NoteTarget = 'TOPIC') {
    const [bookmarks, setBookmarks] = useState<BookmarkDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadBookmarks = useCallback(async () => {
        if (!isLoggedIn) return;
        setIsLoading(true);
        try {
            setBookmarks(await fetchBookmarksApi());
        } catch {
            // silent catch if unauthenticated or network error
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        loadBookmarks();
    }, [loadBookmarks]);

    /** Only the bookmarks of this hook's target type. */
    const scoped = useMemo(
        () => bookmarks.filter(b => b.target === target),
        [bookmarks, target]
    );

    const isBookmarked = useCallback(
        (targetId?: string | number) => {
            if (!targetId) return false;
            const idStr = String(targetId);
            return scoped.some(b => String(b.targetId) === idStr);
        },
        [scoped]
    );

    const toggleBookmark = useCallback(
        async (targetId?: string | number) => {
            if (!targetId || !isLoggedIn) return false;
            const idStr = String(targetId);
            const wasBookmarked = scoped.some(b => String(b.targetId) === idStr);

            // Optimistic, so the icon responds to the click rather than to the round trip.
            if (wasBookmarked) {
                setBookmarks(prev =>
                    prev.filter(b => !(b.target === target && String(b.targetId) === idStr))
                );
            } else {
                setBookmarks(prev => [
                    ...prev,
                    {
                        id: `pending-${idStr}`,
                        target,
                        targetId: idStr,
                        createdAt: new Date().toISOString(),
                        topicId: target === 'TOPIC' ? idStr : null,
                        dsaProblemId: target === 'DSA_PROBLEM' ? idStr : null
                    }
                ]);
            }

            try {
                const result = await toggleBookmarkApi(idStr, target);
                if (result.bookmarked === wasBookmarked) {
                    // The server disagreed with the guess; take its answer.
                    loadBookmarks();
                }
                return result.bookmarked;
            } catch {
                loadBookmarks();
                return wasBookmarked;
            }
        },
        [scoped, isLoggedIn, loadBookmarks, target]
    );

    return {
        /** Bookmarks of this hook's target type. */
        bookmarks: scoped,
        /** Every bookmark, whatever it points at - for a list that shows them all. */
        allBookmarks: bookmarks,
        isLoading,
        isBookmarked,
        toggleBookmark,
        refreshBookmarks: loadBookmarks
    };
}
