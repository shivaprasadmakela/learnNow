import { apiFetch } from './client';

export interface ShareSnippetPayload {
    language: string;
    code: string;
}

export interface SharedSnippetData {
    shortId: string;
    language: string;
    code: string;
    createdAt: string;
}

export async function shareSnippetApi(payload: ShareSnippetPayload): Promise<SharedSnippetData> {
    const res = await apiFetch('/api/compiler/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        throw new Error('Failed to share snippet');
    }
    return res.json() as Promise<SharedSnippetData>;
}

export async function fetchSharedSnippetApi(shortId: string): Promise<SharedSnippetData> {
    const res = await apiFetch(`/api/compiler/snippets/${shortId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch shared snippet');
    }
    return res.json() as Promise<SharedSnippetData>;
}
