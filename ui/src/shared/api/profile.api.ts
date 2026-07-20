import { apiFetch } from './client';
import type { UserProfile, PathData } from '../../types';

export const fetchProfile = async (): Promise<UserProfile> => {
    const response = await apiFetch('/api/user');
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
};

export const updateProfile = async (profile: UserProfile): Promise<UserProfile> => {
    const response = await apiFetch('/api/user', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
};

export const fetchPaths = async (): Promise<PathData[]> => {
    const response = await apiFetch('/api/paths');
    if (!response.ok) throw new Error('Failed to fetch paths');
    return response.json();
};

export interface SubtopicData {
    id: number;
    title: string;
    content: string;
    orderIndex: number;
    isCompleted?: boolean;
}

export interface TopicDetails {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted: boolean;
    subtopics: SubtopicData[];
}

export const fetchTopicDetails = async (id: number): Promise<TopicDetails> => {
    const response = await apiFetch(`/api/topics/${id}`);
    if (!response.ok) throw new Error('Failed to fetch topic details');
    return response.json();
};

export const toggleTopicComplete = async (id: number): Promise<TopicDetails> => {
    const response = await apiFetch(`/api/topics/${id}/toggle-complete`, {
        method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to toggle topic completion');
    return response.json();
};
