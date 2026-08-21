import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './client';
import { authClient } from './authClient';

/**
 * Covers the 401 handling that did not exist before: apiFetch returned the raw response
 * without inspecting the status, so an expired token produced silent failures across
 * every feature.
 */
describe('apiFetch', () => {
    const jsonResponse = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });

    beforeEach(() => {
        authClient.clearToken();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        authClient.clearToken();
    });

    it('attaches the access token as a bearer credential', async () => {
        authClient.setSession('access-1', 'refresh-1');
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
        vi.stubGlobal('fetch', fetchMock);

        await apiFetch('/api/user');

        const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer access-1');
    });

    it('renews the session on a 401 and replays the request', async () => {
        authClient.setSession('expired', 'refresh-1');

        const fetchMock = vi
            .fn()
            // original request rejected
            .mockResolvedValueOnce(jsonResponse({ code: 'unauthorized' }, 401))
            // refresh succeeds
            .mockResolvedValueOnce(
                jsonResponse({ token: 'fresh', refreshToken: 'refresh-2', expiresInSeconds: 1800 })
            )
            // replay succeeds
            .mockResolvedValueOnce(jsonResponse({ ok: true }));
        vi.stubGlobal('fetch', fetchMock);

        const res = await apiFetch('/api/user');

        expect(res.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(authClient.getToken()).toBe('fresh');
        // Rotated, so a captured refresh token is single-use.
        expect(authClient.getRefreshToken()).toBe('refresh-2');
    });

    it('ends the session and notifies listeners when renewal fails', async () => {
        authClient.setSession('expired', 'refresh-1');
        const onEnded = vi.fn();
        const unsubscribe = authClient.onSessionEnded(onEnded);

        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ code: 'unauthorized' }, 401))
            .mockResolvedValueOnce(jsonResponse({ code: 'refresh_token_invalid' }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await apiFetch('/api/user');

        expect(onEnded).toHaveBeenCalledOnce();
        expect(authClient.getToken()).toBeNull();
        unsubscribe();
    });

    it('does not try to renew a failed sign-in', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ code: 'bad' }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await apiFetch('/api/auth/login', { method: 'POST' });

        // One call only: renewing a login attempt would mask a wrong password.
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
