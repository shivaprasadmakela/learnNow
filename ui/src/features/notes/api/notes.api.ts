import { apiFetch, apiFetchJson } from '../../../shared/api/client';

/**
 * Notes and bookmarks, across every kind of content.
 *
 * Both used to be topic-only on the client and split across two tables on the server. They are now
 * one of each, discriminated by `target`, so a "my bookmarks" screen can filter rather than merge
 * two lists — and the DSA sheet reuses all of it instead of adding a parallel set of endpoints.
 */
export type NoteTarget = 'SUBTOPIC' | 'TOPIC' | 'DSA_PROBLEM';

export interface NoteDto {
    id: string | null;
    target: NoteTarget;
    targetId: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    /** Populated only when the note points at one of these. Kept for existing callers. */
    subtopicId?: string | null;
    topicId?: string | null;
    dsaProblemId?: string | null;
}

export interface BookmarkDto {
    id: string;
    target: NoteTarget;
    targetId: string;
    createdAt: string;
    topicId?: string | null;
    dsaProblemId?: string | null;
}

/** Alias retained so the study console's imports keep resolving. */
export type TopicNoteDto = NoteDto;

const NOTE_PATHS: Record<NoteTarget, string> = {
    SUBTOPIC: 'subtopics',
    TOPIC: 'topics',
    DSA_PROBLEM: 'dsa-problems'
};

export const fetchNote = (target: NoteTarget, targetId: string): Promise<NoteDto> =>
    apiFetchJson<NoteDto>(`/api/me/notes/${NOTE_PATHS[target]}/${targetId}`);

export const saveNote = (
    target: NoteTarget,
    targetId: string,
    content: string
): Promise<NoteDto> =>
    apiFetchJson<NoteDto>(`/api/me/notes/${NOTE_PATHS[target]}/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

/** Every note the learner has written, or just one kind of them. */
export const fetchAllNotes = (target?: NoteTarget): Promise<NoteDto[]> =>
    apiFetchJson<NoteDto[]>(`/api/me/notes${target ? `?target=${target}` : ''}`);

export const fetchTopicNote = (topicId: string): Promise<NoteDto> => fetchNote('TOPIC', topicId);

export const saveTopicNote = (topicId: string, content: string): Promise<NoteDto> =>
    saveNote('TOPIC', topicId, content);

export const fetchDsaProblemNote = (problemId: string): Promise<NoteDto> =>
    fetchNote('DSA_PROBLEM', problemId);

export const saveDsaProblemNote = (problemId: string, content: string): Promise<NoteDto> =>
    saveNote('DSA_PROBLEM', problemId, content);

/**
 * Bookmarks are cached because several components ask for them independently on the same screen -
 * the dashboard list, the topic cards, and every DSA problem row.
 */
let bookmarksCache: BookmarkDto[] | null = null;
let bookmarksPromise: Promise<BookmarkDto[]> | null = null;

export const invalidateBookmarksCache = () => {
    bookmarksCache = null;
    bookmarksPromise = null;
};

export const toggleBookmarkApi = async (
    targetId: string,
    target: NoteTarget = 'TOPIC'
): Promise<{ bookmarked: boolean }> => {
    invalidateBookmarksCache();
    const res = await apiFetch(`/api/me/bookmarks/${NOTE_PATHS[target]}/${targetId}`, {
        method: 'POST'
    });
    if (!res.ok) throw new Error('Could not update that bookmark');
    return res.json();
};

export const fetchBookmarksApi = async (force: boolean = false): Promise<BookmarkDto[]> => {
    if (!force && bookmarksCache) return bookmarksCache;
    if (!force && bookmarksPromise) return bookmarksPromise;

    bookmarksPromise = (async () => {
        const data = await apiFetchJson<BookmarkDto[]>('/api/me/bookmarks');
        bookmarksCache = data;
        bookmarksPromise = null;
        return data;
    })().catch(err => {
        bookmarksPromise = null;
        throw err;
    });

    return bookmarksPromise;
};
