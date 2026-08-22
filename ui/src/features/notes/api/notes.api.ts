import { apiFetch } from '../../../shared/api/client';

export interface TopicNoteDto {
    id: string | null;
    topicId: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BookmarkDto {
    id: string;
    topicId: string;
    createdAt: string;
}

export const fetchTopicNote = async (topicId: string): Promise<TopicNoteDto> => {
    const res = await apiFetch(`/api/me/notes/topics/${topicId}`);
    if (!res.ok) throw new Error('Failed to fetch topic note');
    return res.json();
};

export const saveTopicNote = async (topicId: string, content: string): Promise<TopicNoteDto> => {
    const res = await apiFetch(`/api/me/notes/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to save topic note');
    return res.json();
};

export const fetchAllTopicNotes = async (): Promise<TopicNoteDto[]> => {
    const res = await apiFetch('/api/me/notes/topics');
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
};

let bookmarksCache: BookmarkDto[] | null = null;
let bookmarksPromise: Promise<BookmarkDto[]> | null = null;

export const invalidateBookmarksCache = () => {
    bookmarksCache = null;
    bookmarksPromise = null;
};

export const toggleBookmarkApi = async (topicId: string): Promise<{ bookmarked: boolean }> => {
    invalidateBookmarksCache();
    const res = await apiFetch(`/api/me/bookmarks/topics/${topicId}`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to toggle bookmark');
    return res.json();
};

export const fetchBookmarksApi = async (force: boolean = false): Promise<BookmarkDto[]> => {
    if (!force && bookmarksCache) return bookmarksCache;
    if (!force && bookmarksPromise) return bookmarksPromise;

    bookmarksPromise = (async () => {
        const res = await apiFetch('/api/me/bookmarks');
        if (!res.ok) throw new Error('Failed to fetch bookmarks');
        const data = await res.json();
        bookmarksCache = data;
        bookmarksPromise = null;
        return data;
    })().catch(err => {
        bookmarksPromise = null;
        throw err;
    });

    return bookmarksPromise;
};
