import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const apiFetch = vi.fn();

vi.mock('../../../../shared/api/client', async importOriginal => {
    const actual = await importOriginal<typeof import('../../../../shared/api/client')>();
    return { ...actual, apiFetch: (...args: unknown[]) => apiFetch(...args) };
});

describe('ForgotPasswordForm', () => {
    beforeEach(() => {
        apiFetch.mockReset();
    });

    it('starts from the address already typed on the sign-in form', () => {
        render(<ForgotPasswordForm initialEmail="ana@example.com" onBackToSignIn={vi.fn()} />);
        expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
    });

    it('checks the address before sending anything', () => {
        render(<ForgotPasswordForm onBackToSignIn={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        expect(screen.getByText(/does not look like an email/)).toBeInTheDocument();
        expect(apiFetch).not.toHaveBeenCalled();
    });

    /** The server answers the same for unknown addresses, and so must the confirmation. */
    it('confirms without saying whether the account exists', async () => {
        apiFetch.mockResolvedValue(new Response(null, { status: 202 }));
        render(<ForgotPasswordForm onBackToSignIn={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: '  ana@example.com ' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        await screen.findByRole('heading', { name: 'Check your inbox' });
        expect(screen.getByText(/If an account exists for/)).toBeInTheDocument();
        expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ email: 'ana@example.com' });
        // A resend straight away would only hit the rate limit.
        expect(screen.getByRole('button', { name: /Resend in/ })).toBeDisabled();
    });

    it('goes back to sign-in', () => {
        const onBack = vi.fn();
        render(<ForgotPasswordForm onBackToSignIn={onBack} />);
        fireEvent.click(screen.getByRole('button', { name: /Back to sign in/ }));
        expect(onBack).toHaveBeenCalled();
    });
});
