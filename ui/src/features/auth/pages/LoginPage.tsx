import React, { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useToast } from '../../../shared/components/feedback/Toast';
import { Button, Input, Checkbox } from '../../../shared/components';
import styles from '../styles/LoginPage.module.css';

interface LoginPageProps {
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (firstName: string, lastName: string, email: string, pass: string) => Promise<unknown>;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'ROADMAP') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ signIn, signUp }) => {
    const { showToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);

    // Form inputs state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Create Account form inputs
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const validateEmail = (val: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(val);
    };

    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            showToast('Email is required.', 'error');
            return;
        }
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }
        if (!password) {
            showToast('Password is required.', 'error');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
        } catch (err: unknown) {
            console.error('Sign in error:', err);
            const message = err instanceof Error ? err.message : 'An error occurred during sign in. Please check your credentials.';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim()) {
            showToast('First name is required.', 'error');
            return;
        }
        if (!lastName.trim()) {
            showToast('Last name is required.', 'error');
            return;
        }
        if (!email) {
            showToast('Email is required.', 'error');
            return;
        }
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }
        if (!password) {
            showToast('Password is required.', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }
        if (password !== passwordConfirmation) {
            showToast('Passwords do not match.', 'error');
            return;
        }
        setLoading(true);
        try {
            await signUp(firstName.trim(), lastName.trim(), email, password);
            setIsRegisteredSuccess(true);

            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setPasswordConfirmation('');
        } catch (err: unknown) {
            console.error('Sign up error:', err);
            const message = err instanceof Error ? err.message : 'An error occurred during registration. Please try again.';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthMode = () => {
        setIsSignUp(!isSignUp);
    };

    return (
        <div className={styles.authPageContainer}>
            {isRegisteredSuccess ? (
                <div className={styles.successCardContent}>
                    <MailCheck className={styles.successMailIcon} size={64} />
                    <h2 className={styles.successHeading}>Verify your email</h2>
                    <p className={styles.successDescription}>
                        We have sent a verification link. Please check your inbox (or your local developer console log) to confirm your registration.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setIsRegisteredSuccess(false);
                            setIsSignUp(false);
                        }}
                    >
                        Continue to Sign In
                    </Button>
                </div>
            ) : (
                <div className={styles.authCard}>
                    <h2 className={styles.viewTitle}>{isSignUp ? "Join the squad! Let's get building." : "Hey, welcome back!"}</h2>

                    {!isSignUp ? (
                        <form onSubmit={handleSignInSubmit} className={styles.authForm}>
                            <Input
                                type="email"
                                placeholder="Email*"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <Input
                                type="password"
                                placeholder="Password*"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />

                            <div className={styles.formOptionsRow}>
                                <Checkbox
                                    label="Remember Me"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={loading}
                                />
                                <span
                                    className={styles.blueLink}
                                    onClick={() => showToast('Forgot password logic is coming soon!', 'info')}
                                >
                                    Forgot password?
                                </span>
                            </div>

                            <div className={styles.actionsRow}>
                                <span className={styles.blueLinkBold} onClick={toggleAuthMode}>
                                    Create account
                                </span>
                                <Button type="submit" variant="primary" isLoading={loading}>
                                    Let's go!
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSignUpSubmit} className={styles.authForm}>
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

                            <div className={styles.actionsRow}>
                                <span className={styles.blueLinkBold} onClick={toggleAuthMode}>
                                    Sign in
                                </span>
                                <Button type="submit" variant="primary" isLoading={loading}>
                                    Sign me up!
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};
