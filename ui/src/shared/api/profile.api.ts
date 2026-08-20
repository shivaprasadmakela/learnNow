import { apiFetch } from './client';
import type { UserProfile, PathData } from '../../types';

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

let pathsCache: PathData[] | null = null;
let pathsPromise: Promise<PathData[]> | null = null;

export const invalidatePathsCache = () => {
    pathsCache = null;
    pathsPromise = null;
};

export const fetchPaths = async (force: boolean = false): Promise<PathData[]> => {
    if (!force && pathsCache) return pathsCache;
    if (!force && pathsPromise) return pathsPromise;

    pathsPromise = (async () => {
        const response = await apiFetch('/api/paths');
        if (!response.ok) throw new Error('Failed to fetch paths');
        const data = await response.json();
        pathsCache = data;
        pathsPromise = null;
        return data;
    })().catch(err => {
        pathsPromise = null;
        throw err;
    });

    return pathsPromise;
};

export const fetchPublicPaths = async (): Promise<PathData[]> => {
    const response = await apiFetch('/api/catalog/paths');
    if (!response.ok) throw new Error('Failed to fetch catalog paths');
    return response.json();
};

export const fetchTopicsByPath = async (pathId: string | number) => {
    const response = await apiFetch(`/api/paths/${pathId}/topics`);
    if (!response.ok) throw new Error('Failed to fetch topics for path');
    return response.json();
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
