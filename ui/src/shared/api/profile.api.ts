import { apiFetch } from './client';
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
    expectedOutput?: string;
    runnable?: boolean;
    editable?: boolean;
    orderIndex?: number;
}

export interface QuizQuestionDto {
    id?: string;
    kind?: 'mcq' | 'true_false' | 'fill_blank' | string;
    prompt?: string;
    question?: string;
    options?: string[];
    correctAnswer?: string;
    answer?: string;
    explanation?: string;
    points?: number;
}

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

export interface TopicDetails {
    id: number | string;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted: boolean;
    progressPercentage: number;
    subtopics: SubtopicData[];
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
    return response.json();
};

export const fetchTopicDetails = async (id: string | number): Promise<TopicDetails> => {
    const response = await apiFetch(`/api/topics/${id}`);
    if (!response.ok) throw new Error('Failed to fetch topic details');
    return response.json();
};
