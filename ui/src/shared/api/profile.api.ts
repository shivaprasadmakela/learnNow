import { apiFetch } from './client';
import type { UserProfile, PathData } from '../../types';

export const fetchProfile = async (): Promise<UserProfile> => {
    const response = await apiFetch('/api/user');
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
};

export const updateProfile = async (profile: Partial<UserProfile> & { fullName: string }): Promise<UserProfile> => {
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

export const fetchPaths = async (): Promise<PathData[]> => {
    const response = await apiFetch('/api/paths');
    if (!response.ok) throw new Error('Failed to fetch paths');
    return response.json();
};

export const fetchPublicPaths = async (): Promise<PathData[]> => {
    const response = await fetch('/api/catalog/paths');
    if (!response.ok) throw new Error('Failed to fetch catalog paths');
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
    kind: 'mcq' | 'true_false' | 'fill_blank';
    prompt: string;
    options: string[];
    correctAnswer: string;
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
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted: boolean;
    progressPercentage: number;
    subtopics: SubtopicData[];
}

export const fetchTopicDetails = async (id: string | number): Promise<TopicDetails> => {
    const response = await apiFetch(`/api/topics/${id}`);
    if (!response.ok) throw new Error('Failed to fetch topic details');
    return response.json();
};
