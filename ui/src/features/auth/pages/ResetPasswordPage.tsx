import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, KeyRound, LinkIcon } from 'lucide-react';
import { Button } from '../../../shared/components';
import { PasswordField } from '../components/PasswordField';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    isDeadResetLink,
    resetPassword
} from '../api/passwordReset.api';
import styles from '../styles/ResetPasswordPage.module.css';

export interface ResetPasswordPageProps {
    /** Called once the new password is saved. Every session was revoked, so this signs in again. */
    onResetComplete: () => void;
    onBackToSignIn: () => void;
}

type Phase = 'form' | 'success' | 'dead-link' | 'request-new';

const readTokenFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = new URLSearchParams(window.location.search).get('token');
    return token && token.trim() ? token.trim() : null;
};

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
    onResetComplete,
    onBackToSignIn
}) => {
    const [token] = useState<string | null>(readTokenFromUrl);

    /*
     * Takes the one-time token out of the address bar once it is in memory.
     *
     * Left there, it would sit in browser history and go out as the Referer to anything the page
     * loads - and until it is used, it is as good as the account's password. A refresh after
     * this lands on "request a new link", which is the safe way to fail. An effect rather than
     * the state initialiser, because StrictMode runs initialisers twice and the second run would
     * find the token already gone.
     */
    useEffect(() => {
        if (window.location.search) {
            window.history.replaceState(window.history.state, '', window.location.pathname);
        }
    }, []);
    const [phase, setPhase] = useState<Phase>(token ? 'form' : 'dead-link');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [deadLinkMessage, setDeadLinkMessage] = useState<string | null>(null);

    const longEnough = password.length >= PASSWORD_MIN_LENGTH;
    const notTooLong = password.length <= PASSWORD_MAX_LENGTH;
    const matches = password.length > 0 && password === confirmation;
    const valid = longEnough && notTooLong && matches;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (!valid || !token) return;

        setSaving(true);
        try {
            await resetPassword(token, password);
            setPassword('');
            setConfirmation('');
            setPhase('success');
        } catch (err) {
            if (isDeadResetLink(err)) {
                setDeadLinkMessage(err instanceof Error ? err.message : null);
                setPhase('dead-link');
            } else {
                setServerError(
                    err instanceof Error ? err.message : 'Could not save your password. Try again.'
                );
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                {phase === 'form' && (
                    <>
                        <span className={styles.icon} aria-hidden="true">
                            <KeyRound size={26} />
                        </span>
                        <h1 className={styles.title}>Choose a new password</h1>
                        <p className={styles.description}>
                            Saving it signs you out on every other device.
                        </p>

                        <form className={styles.form} onSubmit={handleSubmit} noValidate>
                            {/* Lets password managers file the new password under the right account. */}
                            <input
                                type="text"
                                name="username"
                                autoComplete="username"
                                hidden
                                readOnly
                            />
                            <PasswordField
                                label="New password"
                                autoComplete="new-password"
                                autoFocus
                                value={password}
                                maxLength={PASSWORD_MAX_LENGTH}
                                onChange={e => setPassword(e.target.value)}
                                disabled={saving}
                                error={
                                    submitted && !longEnough
                                        ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
                                        : undefined
                                }
                            />
                            <PasswordField
                                label="Confirm new password"
                                autoComplete="new-password"
                                value={confirmation}
                                maxLength={PASSWORD_MAX_LENGTH}
                                onChange={e => setConfirmation(e.target.value)}
                                disabled={saving}
                                error={
                                    submitted && longEnough && !matches
                                        ? 'The two passwords do not match.'
                                        : undefined
                                }
                            />

                            <ul className={styles.rules} aria-label="Password requirements">
                                <Rule met={longEnough}>
                                    At least {PASSWORD_MIN_LENGTH} characters
                                </Rule>
                                <Rule met={matches}>Both entries match</Rule>
                            </ul>

                            {serverError && (
                                <p className={styles.serverError} role="alert">
                                    {serverError}
                                </p>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={saving}
                                className={styles.submit}
                            >
                                Save new password
                            </Button>
                        </form>
                    </>
                )}

                {phase === 'success' && (
                    <div className={styles.centered} role="status">
                        <CheckCircle2 className={styles.successIcon} size={52} aria-hidden="true" />
                        <h1 className={styles.title}>Password updated</h1>
                        <p className={styles.description}>
                            You have been signed out everywhere. Sign in with your new password to
                            pick up where you left off.
                        </p>
                        <Button variant="primary" onClick={onResetComplete} className={styles.submit}>
                            Sign in
                        </Button>
                    </div>
                )}

                {phase === 'dead-link' && (
                    <div className={styles.centered}>
                        <span className={`${styles.icon} ${styles.iconWarn}`} aria-hidden="true">
                            <LinkIcon size={24} />
                        </span>
                        <h1 className={styles.title}>This link no longer works</h1>
                        <p className={styles.description}>
                            {deadLinkMessage ??
                                'Reset links work once and expire after 60 minutes. Request a fresh one and use the newest email.'}
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => setPhase('request-new')}
                            className={styles.submit}
                        >
                            Request a new link
                        </Button>
                        <button type="button" className={styles.linkBtn} onClick={onBackToSignIn}>
                            Back to sign in
                        </button>
                    </div>
                )}

                {phase === 'request-new' && (
                    <>
                        <h1 className={styles.title}>Reset your password</h1>
                        <ForgotPasswordForm onBackToSignIn={onBackToSignIn} />
                    </>
                )}
            </div>
        </div>
    );
};

const Rule: React.FC<{ met: boolean; children: React.ReactNode }> = ({ met, children }) => (
    <li className={met ? styles.ruleMet : styles.rule}>
        {met ? <CheckCircle2 size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
        <span>{children}</span>
        <span className={styles.srOnly}>{met ? '(done)' : '(not yet)'}</span>
    </li>
);

export default ResetPasswordPage;
