import { authClient } from './authClient';

export const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = authClient.getToken();
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
