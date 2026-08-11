import { apiFetch } from '../../../shared/api/client';

export interface SubtopicNoteDto {
    id: string | null;
    subtopicId: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BookmarkDto {
    id: string;
    topicId: string;
    createdAt: string;
}

export const fetchSubtopicNote = async (subtopicId: string): Promise<SubtopicNoteDto> => {
    const res = await apiFetch(`/api/me/notes/subtopics/${subtopicId}`);
    if (!res.ok) throw new Error('Failed to fetch subtopic note');
    return res.json();
};

export const saveSubtopicNote = async (subtopicId: string, content: string): Promise<SubtopicNoteDto> => {
    const res = await apiFetch(`/api/me/notes/subtopics/${subtopicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to save subtopic note');
    return res.json();
};

export const fetchAllNotes = async (): Promise<SubtopicNoteDto[]> => {
    const res = await apiFetch('/api/me/notes');
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
