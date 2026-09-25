import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import styles from './GoogleLoginButton.module.css';

interface GoogleLoginButtonProps {
    onSuccess: (idToken: string) => void;
    onError?: (error: unknown) => void;
    clientId?: string;
    /**
     * Required, not optional. Continuing with Google creates an account for a first-time visitor,
     * so the notice has to be on screen at that moment — s.5 wants it given at or before consent.
     * Making it part of this component means the button cannot be placed anywhere without it.
     *
     * This line is also the whole of the confirmation for the Google route. The button is never
     * gated behind a separate tick: the line below it says what continuing means, which is what
     * s.5 asks for, and an inert button that has to be unlocked first only reads as broken.
     */
    onOpenPrivacyNotice: () => void;
}

const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/*
 * Module scope, not inside the component. Declared during render it was a new component type on
 * every render, so React threw the subtree away and rebuilt it each time rather than updating it.
 */
const GoogleIconSvg: React.FC = () => (
    <svg className={styles.googleIcon} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
);

/** The line that travels with the button. See onOpenPrivacyNotice. */
const PrivacyLine: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
    <p className={styles.privacyLine}>
        By continuing you confirm you have read our{' '}
        <button type="button" className={styles.privacyLink} onClick={onOpen}>
            privacy notice
        </button>
        .
    </p>
);

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
    onSuccess,
    onError,
    clientId = DEFAULT_CLIENT_ID,
    onOpenPrivacyNotice
}) => {
    if (!clientId) {
        return (
            <div className={styles.googleContainer}>
                <button
                    type="button"
                    className={styles.googleBtn}
                    onClick={() => {
                        if (onError) {
                            onError(new Error('Google Client ID is not configured (VITE_GOOGLE_CLIENT_ID missing).'));
                        }
                    }}
                >
                    <GoogleIconSvg />
                    <span>Continue with Google</span>
                </button>
                <PrivacyLine onOpen={onOpenPrivacyNotice} />
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className={styles.googleContainer}>
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                            onSuccess(credentialResponse.credential);
                        }
                    }}
                    onError={() => {
                        if (onError) onError(new Error('Google sign-in was unsuccessful.'));
                    }}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    width="100%"
                    text="continue_with"
                    logo_alignment="center"
                    useOneTap
                />
                <PrivacyLine onOpen={onOpenPrivacyNotice} />
            </div>
        </GoogleOAuthProvider>
    );
};
