import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResetPasswordPage } from './ResetPasswordPage';

const apiFetch = vi.fn();

vi.mock('../../../shared/api/client', async importOriginal => {
    const actual = await importOriginal<typeof import('../../../shared/api/client')>();
    return { ...actual, apiFetch: (...args: unknown[]) => apiFetch(...args) };
});

const json = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });

const GOOD_PASSWORD = 'correct horse battery';

const visit = (search: string) => window.history.replaceState(null, '', `/reset-password${search}`);

const renderPage = () => {
    const onResetComplete = vi.fn();
    const onBackToSignIn = vi.fn();
    render(<ResetPasswordPage onResetComplete={onResetComplete} onBackToSignIn={onBackToSignIn} />);
    return { onResetComplete, onBackToSignIn };
};

const fill = (password: string, confirmation = password) => {
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
        target: { value: confirmation }
    });
};

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        apiFetch.mockReset();
    });

    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    it('takes the token out of the address bar', () => {
        visit('?token=secret-token');
        renderPage();
        expect(window.location.search).toBe('');
        expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
    });

    it('explains a link with no token instead of showing a form that cannot work', () => {
        visit('');
        renderPage();
        expect(screen.getByRole('heading', { name: /no longer works/ })).toBeInTheDocument();
    });

    it('holds a short password back without calling the server', () => {
        visit('?token=t');
        renderPage();

        fill('short');
        fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

        expect(screen.getByText('Use at least 12 characters.')).toBeInTheDocument();
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('holds back passwords that do not match', () => {
        visit('?token=t');
        renderPage();

        fill(GOOD_PASSWORD, `${GOOD_PASSWORD}!`);
        fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

        expect(screen.getByText('The two passwords do not match.')).toBeInTheDocument();
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('saves the password and hands back to sign-in', async () => {
        visit('?token=the-token');
        apiFetch.mockResolvedValue(new Response(null, { status: 204 }));
        const { onResetComplete } = renderPage();

        fill(GOOD_PASSWORD);
        fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

        await screen.findByRole('heading', { name: 'Password updated' });
        const [url, init] = apiFetch.mock.calls[0];
        expect(url).toBe('/api/auth/reset-password');
        expect(JSON.parse(init.body)).toEqual({ token: 'the-token', password: GOOD_PASSWORD });

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
        expect(onResetComplete).toHaveBeenCalled();
    });

    it('turns an expired link into a way to request a new one', async () => {
        visit('?token=old');
        apiFetch.mockResolvedValueOnce(
            json(401, {
                code: 'reset_token_expired',
                message: 'This password reset link has expired. Please request a new one.'
            })
        );
        renderPage();

        fill(GOOD_PASSWORD);
        fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

        await screen.findByText(/has expired/);
        fireEvent.click(screen.getByRole('button', { name: 'Request a new link' }));

        apiFetch.mockResolvedValueOnce(new Response(null, { status: 202 }));
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        await screen.findByRole('heading', { name: 'Check your inbox' });
        expect(apiFetch.mock.calls[1][0]).toBe('/api/auth/forgot-password');
    });

    it('keeps the form and explains a failure that is not about the link', async () => {
        visit('?token=t');
        apiFetch.mockResolvedValue(json(429, { code: 'too_many_requests', message: 'Too many' }));
        renderPage();

        fill(GOOD_PASSWORD);
        fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent(/Too many attempts/)
        );
        expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });
});
