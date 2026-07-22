import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../shared/api/client';
import { useToast } from '../../../shared/components/feedback/Toast';
import styles from '../styles/VerifyEmailPage.module.css';

interface VerifyEmailPageProps {
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => void;
    onVerificationSuccess: (token: string, profile: any) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ changeView, onVerificationSuccess }) => {
    const { showToast } = useToast();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [email, setEmail] = useState('');
    const [resending, setResending] = useState(false);
    const verifiedRef = useRef(false);

    useEffect(() => {
        if (verifiedRef.current) return;
        verifiedRef.current = true;

        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');

        if (!token) {
            setStatus('error');
            return;
        }

        const performVerification = async () => {
            try {
                const response = await apiFetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                if (response.ok) {
                    const data = await response.json();
                    setStatus('success');
                    showToast('Email verified successfully! Logging you in...', 'success');
                    setTimeout(() => {
                        onVerificationSuccess(data.token, data.profile);
                    }, 1500);
                } else {
                    setStatus('error');
                }
            } catch (e) {
                console.error("Verification failed", e);
                setStatus('error');
            }
        };

        performVerification();
    }, []);

    const handleResendSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            showToast('Email address is required.', 'error');
            return;
        }

        setResending(true);
        try {
            const response = await apiFetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showToast('A new verification email has been sent!', 'success');
                setEmail('');
            } else {
                const text = await response.text();
                showToast(text || 'Resend request failed.', 'error');
            }
        } catch (err) {
            console.error("Resend error", err);
            showToast('Failed to resend email. Please try again.', 'error');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className={styles.verifyContainer}>
            <div className={styles.verifyCard}>
                {status === 'verifying' && (
                    <>
                        <div className={styles.spinner} />
                        <h2 className={styles.title}>Verifying your email</h2>
                        <p className={styles.description}>
                            Please wait while we check your registration details...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className={styles.successIcon} size={54} />
                        <h2 className={styles.title}>Email verified!</h2>
                        <p className={styles.description}>
                            Thank you for verifying your email. You are being logged in automatically...
                        </p>
                        <button className={styles.btn} onClick={() => changeView('LOGIN')}>
                            Go to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className={styles.errorIcon} size={54} />
                        <h2 className={styles.title}>Verification failed</h2>
                        <p className={styles.description}>
                            The verification link is invalid, expired, or has already been used. Please request a new verification email.
                        </p>
                        
                        <form onSubmit={handleResendSubmit} className={styles.resendForm}>
                            <label className={styles.resendLabel}>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={resending}
                            />
                            <button type="submit" className={styles.btn} disabled={resending}>
                                {resending ? (
                                    <>
                                        <Loader2 style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }} size={16} />
                                        Sending...
                                    </>
                                ) : (
                                    'Resend Verification Link'
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
