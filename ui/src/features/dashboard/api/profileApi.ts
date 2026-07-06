import { supabase } from '../../../shared/supabaseClient';
import type { UserProfile } from '../types';

const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const fetchProfile = async (): Promise<UserProfile> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/profile', { headers });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
};

export const updateProfile = async (profile: UserProfile): Promise<UserProfile> => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
};
