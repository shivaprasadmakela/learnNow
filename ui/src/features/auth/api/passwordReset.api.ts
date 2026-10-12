import { apiFetch, ApiError } from '../../../shared/api/client';

/**
 * Must match `ResetPasswordRequest` / `RegisterRequest` on the backend. Checking it here first
 * turns a `validation_failed` round trip into a hint the learner sees while typing.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** The error codes `POST /api/auth/reset-password` answers a dead link with. */
const DEAD_LINK_CODES = new Set([
    'reset_token_invalid',
    'reset_token_expired',
    'reset_token_already_used',
    'token_required'
]);

export const isDeadResetLink = (error: unknown): boolean =>
    error instanceof ApiError && error.code != null && DEAD_LINK_CODES.has(error.code);

/** Both endpoints answer success with an empty body, so `apiFetchJson` cannot be used. */
const postExpectingNoContent = async (url: string, body: unknown): Promise<void> => {
    const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (response.ok) return;

    let message = 'Something went wrong. Please try again.';
    let code: string | null = null;
    try {
        const data = await response.json();
        if (typeof data?.code === 'string') code = data.code;
        if (typeof data?.message === 'string') message = data.message;
    } catch {
        /* non-JSON body - keep the generic message */
    }
    if (response.status === 429) {
        message = 'Too many attempts. Please wait a minute and try again.';
    } else if (code === 'validation_failed') {
        // The raw detail is "password: password_too_weak", which is for logs, not people.
        message = `Choose a password between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
    }
    throw new ApiError(message, response.status, code);
};

/**
 * Emails a reset link. The server answers 202 whether or not the address has an account, so
 * success here means "sent if it exists" and the UI must say exactly that.
 */
export const requestPasswordReset = (email: string): Promise<void> =>
    postExpectingNoContent('/api/auth/forgot-password', { email: email.trim() });

/** Sets the new password. Every existing session is revoked server-side on success. */
export const resetPassword = (token: string, password: string): Promise<void> =>
    postExpectingNoContent('/api/auth/reset-password', { token, password });
