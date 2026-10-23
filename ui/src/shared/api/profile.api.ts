import { apiFetch } from './client';
import { progressChanged } from './cache';
import { DEFAULT_PAGE_SIZE, toPageResponse, withPageParams, type PageResponse } from './pagination';
import type { UserProfile, PathData } from '../../types';
import type { Topic } from '../../features/topics';

let profileCache: UserProfile | null = null;
let profilePromise: Promise<UserProfile> | null = null;

export const invalidateProfileCache = () => {
    profileCache = null;
    profilePromise = null;
};

export const fetchProfile = async (force: boolean = false): Promise<UserProfile> => {
    if (!force && profileCache) return profileCache;
    if (!force && profilePromise) return profilePromise;

    profilePromise = (async () => {
        const response = await apiFetch('/api/user');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        profileCache = data;
        profilePromise = null;
        return data;
    })().catch(err => {
        profilePromise = null;
        throw err;
    });

    return profilePromise;
};

export const updateProfile = async (profile: Partial<UserProfile> & { fullName: string }): Promise<UserProfile> => {
    invalidateProfileCache();
    const response = await apiFetch('/api/user', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fullName: profile.fullName,
            avatar: profile.avatar,
            bio: profile.bio
        })
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
};

/**
 * Cache of path pages already fetched, keyed by page number.
 *
 * Paths arrive one page at a time as the user scrolls, so the cache has to be per page rather
 * than a single list - otherwise returning to the Paths view would refetch page one and throw
 * away everything the user had already scrolled past.
 */
const pathsPageCache = new Map<string, PageResponse<PathData>>();
const pathsPagePromises = new Map<string, Promise<PageResponse<PathData>>>();

const pageKey = (page: number, size: number) => `${page}:${size}`;

export const invalidatePathsCache = () => {
    pathsPageCache.clear();
    pathsPagePromises.clear();
};

export const fetchPathsPage = async (
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE,
    force: boolean = false
): Promise<PageResponse<PathData>> => {
    const key = pageKey(page, size);
    if (!force) {
        const cached = pathsPageCache.get(key);
        if (cached) return cached;
        const inFlight = pathsPagePromises.get(key);
        if (inFlight) return inFlight;
    }

    const request = (async () => {
        const response = await apiFetch(withPageParams('/api/paths', page, size));
        if (!response.ok) throw new Error('Failed to fetch paths');
        const result = toPageResponse<PathData>(await response.json(), size);
        pathsPageCache.set(key, result);
        pathsPagePromises.delete(key);
        return result;
    })().catch(err => {
        pathsPagePromises.delete(key);
        throw err;
    });

    pathsPagePromises.set(key, request);
    return request;
};

/** First page only. Kept for callers that just need "some paths" rather than the scrolling list. */
export const fetchPaths = async (force: boolean = false): Promise<PathData[]> => {
    const result = await fetchPathsPage(0, DEFAULT_PAGE_SIZE, force);
    return result.content;
};

export const fetchPublicPathsPage = async (
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE
): Promise<PageResponse<PathData>> => {
    const response = await apiFetch(withPageParams('/api/catalog/paths', page, size));
    if (!response.ok) throw new Error('Failed to fetch catalog paths');
    return toPageResponse<PathData>(await response.json(), size);
};

export const fetchPublicPaths = async (): Promise<PathData[]> => {
    const result = await fetchPublicPathsPage();
    return result.content;
};

export const fetchTopicsByPathPage = async (
    pathId: string | number,
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE
): Promise<PageResponse<Topic>> => {
    const response = await apiFetch(withPageParams(`/api/paths/${pathId}/topics`, page, size));
    if (!response.ok) throw new Error('Failed to fetch topics for path');
    return toPageResponse<Topic>(await response.json(), size);
};

export const fetchTopicsByPath = async (pathId: string | number): Promise<Topic[]> => {
    const result = await fetchTopicsByPathPage(pathId);
    return result.content;
};

export interface CodeSnippetItem {
    id: string;
    language: string;
    label?: string;
    code: string;
    /**
     * Whether the snippet has an expected output to compare a run against. The output itself is
     * not sent with the lesson - it is fetched once the learner has run the snippet, so a "predict
     * the output" snippet does not give its answer away. Preview data may carry it inline instead.
     */
    hasExpectedOutput?: boolean;
    expectedOutput?: string;
    runnable?: boolean;
    editable?: boolean;
    orderIndex?: number;
}

/** A learner's first answer to a question; the answer and explanation are set once it was right. */
export interface QuizAttempt {
    isCorrect: boolean;
    correctAnswer?: string | null;
    explanation?: string | null;
}

export interface QuizQuestionDto {
    id?: string;
    kind?: 'mcq' | 'true_false' | 'fill_blank' | string;
    prompt?: string;
    question?: string;
    options?: string[];
    /** Never sent to learners; present only in admin preview data. */
    correctAnswer?: string;
    answer?: string;
    explanation?: string;
    points?: number;
    /** Set when the learner has already answered it. */
    attempt?: QuizAttempt | null;
}

/** One lesson in full - text, code and concept check - fetched when the learner reaches it. */
export interface SubtopicData {
    id: number | string;
    title: string;
    content: string;
    orderIndex: number;
    isCompleted?: boolean;
    level?: 'beginner' | 'intermediate' | 'advanced';
    track?: 'concept' | 'hands-on' | 'interview-prep';
    prerequisites?: string[];
    videoUrl?: string | null;
    estimatedMinutes?: number;
    codeSnippets?: CodeSnippetItem[];
    questions?: QuizQuestionDto[];
}

/** A lesson in a topic's outline: what the contents and the topic list show, without its text. */
export interface LessonOutline {
    id: number | string;
    title: string;
    orderIndex: number;
    isCompleted?: boolean;
    level?: 'beginner' | 'intermediate' | 'advanced';
    track?: 'concept' | 'hands-on' | 'interview-prep';
    estimatedMinutes?: number;
    /** How many concept-check questions the lesson ends with. */
    quizCount?: number;
}

/** A topic as the study console opens it: an outline of its lessons, no lesson text. */
export interface TopicDetails {
    id: number | string;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted: boolean;
    progressPercentage: number;
    /** Opening interview questions on the topic - labels its Interview tab before any load. */
    interviewQuestionCount?: number;
    subtopics: LessonOutline[];
}

export interface QuizSubmitResponse {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
    pointsEarned: number;
}

export const submitQuizAnswer = async (questionId: string, selectedOption: string): Promise<QuizSubmitResponse> => {
    const response = await apiFetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedOption })
    });
    if (!response.ok) throw new Error('Failed to validate quiz answer');
    // A cached lesson would still say the question is unanswered.
    lessonCache.clear();
    // A correct answer earns points, which the dashboard shows.
    progressChanged();
    return response.json();
};

/**
 * Topic outlines by id. Expanding a topic in the list and then opening it asks for the same
 * outline, so it is fetched once; progress changes clear the entry (invalidateTopicDetails).
 */
const topicCache = new Map<string, Promise<TopicDetails>>();

export const invalidateTopicDetails = (id?: string | number) => {
    if (id === undefined) topicCache.clear();
    else topicCache.delete(String(id));
};

export const fetchTopicDetails = (id: string | number): Promise<TopicDetails> => {
    const key = String(id);
    let entry = topicCache.get(key);
    if (!entry) {
        entry = (async () => {
            const response = await apiFetch(`/api/topics/${id}`);
            if (!response.ok) throw new Error('Failed to fetch topic details');
            return response.json() as Promise<TopicDetails>;
        })().catch(err => {
            topicCache.delete(key);
            throw err;
        });
        topicCache.set(key, entry);
    }
    return entry;
};

/** Lessons by id, so scrolling back to one already read does not fetch it again. */
const lessonCache = new Map<string, Promise<SubtopicData>>();

/** One lesson in full, when the learner reaches it. */
export const fetchLesson = (id: string | number): Promise<SubtopicData> => {
    const key = String(id);
    let entry = lessonCache.get(key);
    if (!entry) {
        entry = (async () => {
            const response = await apiFetch(`/api/subtopics/${encodeURIComponent(key)}`);
            if (!response.ok) throw new Error('Failed to fetch lesson');
            return response.json() as Promise<SubtopicData>;
        })().catch(err => {
            lessonCache.delete(key);
            throw err;
        });
        lessonCache.set(key, entry);
    }
    return entry;
};

/** What a lesson's runnable snippet should print - asked for once the learner has run it. */
export const fetchExpectedOutput = async (subtopicId: string | number, snippetId: string): Promise<string | null> => {
    const response = await apiFetch(
        `/api/subtopics/${encodeURIComponent(String(subtopicId))}/snippets/${encodeURIComponent(snippetId)}/expected-output`
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { expectedOutput?: string };
    return data.expectedOutput ?? null;
};
