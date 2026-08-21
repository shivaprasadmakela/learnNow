import { authClient } from './authClient';

const apiBaseUrl = (): string => import.meta.env.VITE_BACKEND_URL || '';

const resolveUrl = (url: string): string => {
    const baseUrl = apiBaseUrl();
    return url.startsWith('/') && baseUrl ? `${baseUrl}${url}` : url;
};

export const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = authClient.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Exchanges the refresh token for a new access token.
 *
 * Deduplicated: several requests can fail with 401 at the same moment, and each must
 * wait on one refresh rather than starting its own and invalidating the others - the
 * backend rotates refresh tokens, so concurrent attempts would sign the user out.
 */
let inFlightRefresh: Promise<boolean> | null = null;

const refreshSession = async (): Promise<boolean> => {
    const refreshToken = authClient.getRefreshToken();
    if (!refreshToken) return false;

    if (!inFlightRefresh) {
        inFlightRefresh = (async () => {
            try {
                const res = await fetch(resolveUrl('/api/auth/refresh'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });
                if (!res.ok) return false;
                const data = await res.json();
                authClient.setSession(data.token, data.refreshToken);
                return true;
            } catch {
                return false;
            } finally {
                inFlightRefresh = null;
            }
        })();
    }
    return inFlightRefresh;
};

/**
 * Authenticated fetch.
 *
 * On a 401 it transparently renews the session once and replays the request. If renewal
 * fails the session is ended and listeners route to sign-in. Previously the status was
 * never inspected at all, so an expired token produced silent, unexplained failures
 * across every feature except the compiler.
 */
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const send = async (): Promise<Response> =>
        fetch(resolveUrl(url), {
            ...options,
            headers: { ...(await getAuthHeaders()), ...options.headers }
        });

    let response = await send();

    const isAuthEndpoint = url.startsWith('/api/auth/');
    if (response.status === 401 && !isAuthEndpoint) {
        if (await refreshSession()) {
            response = await send();
        } else {
            authClient.notifySessionEnded();
        }
    }

    return response;
};

/**
 * Reads the backend's `{ code, message }` error body and throws an Error carrying the
 * server's own message, so callers surface something actionable instead of a generic
 * "request failed".
 */
export const apiFetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const response = await apiFetch(url, options);
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const body = await response.json();
            if (body?.message) message = body.message;
        } catch {
            /* non-JSON body - keep the status-based message */
        }
        throw new Error(message);
    }
    return response.json() as Promise<T>;
};
