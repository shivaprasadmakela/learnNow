import React, { useEffect, useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Button, Input } from '../../../../shared/components';
import { requestPasswordReset } from '../../api/passwordReset.api';
import styles from './ForgotPasswordForm.module.css';

export interface ForgotPasswordFormProps {
    /** Carried over from the sign-in form so nobody types their address twice. */
    initialEmail?: string;
    onBackToSignIn: () => void;
    /** Shown above the field. Defaults to the plain "we'll email you a link" explanation. */
    intro?: React.ReactNode;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Matches the server's forgot-password rate-limit tier closely enough that a resend rarely 429s. */
const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Asks for an email and sends a reset link to it.
 *
 * The confirmation never says whether the address has an account: the server answers the same
 * either way, so that the form cannot be used to find out who is registered.
 */
export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    initialEmail = '',
    onBackToSignIn,
    intro
}) => {
    const [email, setEmail] = useState(initialEmail);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [cooldown]);

    const send = async (address: string) => {
        setError(null);
        setSending(true);
        try {
            await requestPasswordReset(address);
            setSentTo(address);
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send the link. Try again.');
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const address = email.trim();
        if (!address) {
            setError('Enter the email address you signed up with.');
            return;
        }
        if (!EMAIL_PATTERN.test(address)) {
            setError('That does not look like an email address.');
            return;
        }
        void send(address);
    };

    if (sentTo) {
        return (
            <div className={styles.sent} role="status">
                <span className={styles.sentIcon} aria-hidden="true">
                    <MailCheck size={28} />
                </span>
                <h3 className={styles.sentTitle}>Check your inbox</h3>
                <p className={styles.sentText}>
                    If an account exists for <strong>{sentTo}</strong>, we have sent it a link to
                    choose a new password. The link works once and expires in 60 minutes.
                </p>
                <p className={styles.sentNote}>
                    Nothing arrived? Check your spam folder. If you signed up with Google, there is
                    no password to reset - use <em>Continue with Google</em> instead.
                </p>
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}
                <div className={styles.actions}>
                    <button type="button" className={styles.linkBtn} onClick={onBackToSignIn}>
                        <ArrowLeft size={14} /> Back to sign in
                    </button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void send(sentTo)}
                        isLoading={sending}
                        disabled={cooldown > 0}
                    >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <p className={styles.intro}>
                {intro ??
                    'Enter the email address you use for learnNow and we will send you a link to choose a new password.'}
            </p>
            <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                }}
                error={error ?? undefined}
                disabled={sending}
            />
            <div className={styles.actions}>
                <button type="button" className={styles.linkBtn} onClick={onBackToSignIn}>
                    <ArrowLeft size={14} /> Back to sign in
                </button>
                <Button type="submit" variant="primary" isLoading={sending}>
                    Send reset link
                </Button>
            </div>
        </form>
    );
};
