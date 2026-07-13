import { supabase } from '../supabaseClient';

export const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    const headers = {
        ...authHeaders,
        ...options.headers,
    };
    
    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    return response;
};
