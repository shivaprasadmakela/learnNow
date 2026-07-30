import { useState, useEffect, useCallback } from 'react';
import { fetchBookmarksApi, toggleBookmarkApi, type BookmarkDto } from '../api/notes.api';

export function useBookmarks(isLoggedIn: boolean = true) {
    const [bookmarks, setBookmarks] = useState<BookmarkDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadBookmarks = useCallback(async () => {
        if (!isLoggedIn) return;
        setIsLoading(true);
        try {
            const data = await fetchBookmarksApi();
            setBookmarks(data);
        } catch {
            // silent catch if unauthenticated or network error
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        loadBookmarks();
    }, [loadBookmarks]);

    const isBookmarked = useCallback((topicId?: string | number) => {
        if (!topicId) return false;
        const idStr = String(topicId);
        return bookmarks.some(b => String(b.topicId) === idStr);
    }, [bookmarks]);

    const toggleBookmark = useCallback(async (topicId?: string | number) => {
        if (!topicId || !isLoggedIn) return false;
        const idStr = String(topicId);
        const currentlyBookmarked = bookmarks.some(b => String(b.topicId) === idStr);

        // Optimistic UI update
        if (currentlyBookmarked) {
            setBookmarks(prev => prev.filter(b => String(b.topicId) !== idStr));
        } else {
            setBookmarks(prev => [...prev, { id: 'temp-' + Date.now(), topicId: idStr, createdAt: new Date().toISOString() }]);
        }

        try {
            const result = await toggleBookmarkApi(idStr);
            if (result.bookmarked !== !currentlyBookmarked) {
                loadBookmarks();
            }
            return result.bookmarked;
        } catch {
            loadBookmarks();
            return currentlyBookmarked;
        }
    }, [bookmarks, isLoggedIn, loadBookmarks]);

    return {
        bookmarks,
        isLoading,
        isBookmarked,
        toggleBookmark,
        refreshBookmarks: loadBookmarks
    };
}
