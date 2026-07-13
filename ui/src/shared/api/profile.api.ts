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
