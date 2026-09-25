import React from 'react';
import { Button, Input } from '../../../../shared/components';
import { GoogleLoginButton } from '../GoogleLoginButton';
import { SignUpConsent } from '../SignUpConsent';
import styles from '../../styles/LoginPage.module.css';

interface SignUpFormProps {
    firstName: string;
    setFirstName: (val: string) => void;
    lastName: string;
    setLastName: (val: string) => void;
    email: string;
    setEmail: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    passwordConfirmation: string;
    setPasswordConfirmation: (val: string) => void;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onToggleAuthMode: () => void;
    /** Whether the learner has confirmed they read the privacy notice. Required to submit. */
    noticeAccepted: boolean;
    onNoticeAcceptedChange: (accepted: boolean) => void;
    onOpenPrivacyNotice: () => void;
    onGoogleSuccess?: (idToken: string) => void;
    onGoogleError?: (error: unknown) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    loading,
    onSubmit,
    onToggleAuthMode,
    noticeAccepted,
    onNoticeAcceptedChange,
    onOpenPrivacyNotice,
    onGoogleSuccess,
    onGoogleError
}) => {
    return (
        <form onSubmit={onSubmit} className={styles.authForm}>
            <div className={styles.inputGrid}>
                <Input
                    type="text"
                    placeholder="First name*"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                />
                <Input
                    type="text"
                    placeholder="Last name*"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                />
            </div>

            <Input
                type="email"
                placeholder="Email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
            />

            <div className={styles.inputGrid}>
                <Input
                    type="password"
                    placeholder="Password*"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
                <Input
                    type="password"
                    placeholder="Password confirmation*"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    disabled={loading}
                />
            </div>

            <SignUpConsent
                accepted={noticeAccepted}
                onChange={onNoticeAcceptedChange}
                onOpenPrivacyNotice={onOpenPrivacyNotice}
                disabled={loading}
            />

            {/*
              * Google is offered here too, but only once the notice has been confirmed. Before
              * this it sat on the sign-in tab alone, so a first-time visitor could create an
              * account through it without ever meeting the notice or the tick.
              */}
            {onGoogleSuccess && (
                <>
                    <div className={styles.dividerContainer}>
                        <span className={styles.dividerLine} />
                        <span className={styles.dividerText}>OR</span>
                        <span className={styles.dividerLine} />
                    </div>
                    <GoogleLoginButton
                        onSuccess={onGoogleSuccess}
                        onError={onGoogleError}
                        onOpenPrivacyNotice={onOpenPrivacyNotice}
                        disabled={!noticeAccepted}
                    />
                </>
            )}

            <div className={styles.actionsRow}>
                <span className={styles.blueLinkBold} onClick={onToggleAuthMode}>
                    Sign in
                </span>
                <Button type="submit" variant="primary" isLoading={loading}>
                    Sign me up!
                </Button>
            </div>
        </form>
    );
};
