import { apiFetch, ApiError } from '../../../shared/api/client';

/**
 * Small helpers for the trainer routes that answer 204. apiFetchJson always parses a body, so
 * "there is no plan this week" or "rating saved" would otherwise surface as a JSON error.
 */

/** The backend's `{code, message}` error body as an ApiError, or `fallback` when it has none. */
export const toApiError = async (res: Response, fallback: string): Promise<ApiError> => {
    let message = fallback;
    let code: string | null = null;
    try {
        const body = await res.json();
        if (body?.message) message = body.message;
        if (typeof body?.code === 'string') code = body.code;
    } catch {
        /* not JSON - keep the fallback */
    }
    return new ApiError(message, res.status, code);
};

/** JSON from the route, or null when it answers 204 (nothing saved yet). */
export const fetchJsonOrNull = async <T>(url: string, options: RequestInit = {}): Promise<T | null> => {
    const res = await apiFetch(url, options);
    if (res.status === 204) return null;
    if (!res.ok) throw await toApiError(res, `Request failed (${res.status})`);
    return res.json() as Promise<T>;
};

/** For routes that answer 204 on success. */
export const sendExpectingNoContent = async (url: string, options: RequestInit, fallback: string): Promise<void> => {
    const res = await apiFetch(url, options);
    if (!res.ok) throw await toApiError(res, fallback);
};

export const jsonBody = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});
