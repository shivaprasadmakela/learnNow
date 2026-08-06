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

    const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
    const targetUrl = url.startsWith('/') && baseUrl ? `${baseUrl}${url}` : url;
    
    const response = await fetch(targetUrl, {
        ...options,
        headers,
    });
    
    return response;
};
