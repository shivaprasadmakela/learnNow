import { apiFetch } from './client';
import type { UserProfile, PathData } from '../../types';

export const fetchProfile = async (): Promise<UserProfile> => {
    const response = await apiFetch('/api/profile');
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
};

export const updateProfile = async (profile: UserProfile): Promise<UserProfile> => {
    const response = await apiFetch('/api/profile', {
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

export interface TopicSectionData {
    id: number;
    title: string;
    content: string;
    orderIndex: number;
}

export interface SubtopicDetails {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted: boolean;
    sections: TopicSectionData[];
}

export const fetchSubtopicDetails = async (id: number): Promise<SubtopicDetails> => {
    const response = await apiFetch(`/api/subtopics/${id}`);
    if (!response.ok) throw new Error('Failed to fetch subtopic details');
    return response.json();
};

export const toggleSubtopicComplete = async (id: number): Promise<SubtopicDetails> => {
    const response = await apiFetch(`/api/subtopics/${id}/toggle-complete`, {
        method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to toggle subtopic completion');
    return response.json();
};
