import React, { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useToast } from '../../../shared/components/feedback/Toast';
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

    // Error and Success messages
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form inputs state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Create Account form inputs
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');


    // Form validations
    const validateEmail = (val: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(val);
    };

    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!email) {
            setErrorMsg('Email is required.');
            return;
        }
        if (!validateEmail(email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setErrorMsg('Password is required.');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
        } catch (err: unknown) {
            console.error('Sign in error:', err);
            const message = err instanceof Error ? err.message : 'An error occurred during sign in. Please check your credentials.';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        // Validation checks
        if (!firstName.trim()) {
            setErrorMsg('First name is required.');
            return;
        }
        if (!lastName.trim()) {
            setErrorMsg('Last name is required.');
            return;
        }
        if (!email) {
            setErrorMsg('Email is required.');
            return;
        }
        if (!validateEmail(email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setErrorMsg('Password is required.');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            return;
        }
        if (password !== passwordConfirmation) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await signUp(firstName.trim(), lastName.trim(), email, password);
            setIsRegisteredSuccess(true);

            // Reset fields
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setPasswordConfirmation('');
        } catch (err: unknown) {
            console.error('Sign up error:', err);
            const message = err instanceof Error ? err.message : 'An error occurred during registration. Please try again.';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthMode = () => {
        setIsSignUp(!isSignUp);
        setErrorMsg(null);
        setSuccessMsg(null);
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
                    <button
                        type="button"
                        className={styles.successActionBtn}
                        onClick={() => {
                            setIsRegisteredSuccess(false);
                            setIsSignUp(false);
                        }}
                    >
                        Continue to Sign In
                    </button>
                </div>
            ) : (
                <div className={styles.authCard}>
                    <h2 className={styles.viewTitle}>{isSignUp ? "Join the squad! Let's get building." : "Hey, welcome back!"}</h2>



                {errorMsg && (
                    <div className={styles.formAlertError}>
                        <span className={styles.alertIcon}>⚠️</span>
                        <span className={styles.alertText}>{errorMsg}</span>
                    </div>
                )}

                {successMsg && (
                    <div className={styles.formAlertSuccess}>
                        <span className={styles.alertIcon}>✅</span>
                        <span className={styles.alertText}>{successMsg}</span>
                    </div>
                )}

                {/* Main Auth Form */}
                {!isSignUp ? (
                    /* SIGN IN FORM */
                    <form onSubmit={handleSignInSubmit} className={styles.authForm}>
                        <div className={styles.inputContainer}>
                            <input
                                type="email"
                                placeholder="Email*"
                                className={styles.outlineInput}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className={styles.inputContainer}>
                            <input
                                type="password"
                                placeholder="Password*"
                                className={styles.outlineInput}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className={styles.formOptionsRow}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={loading}
                                />
                                <span>Remember Me</span>
                            </label>
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
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Signing in...' : "Let's go!"}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* CREATE ACCOUNT FORM */
                    <form onSubmit={handleSignUpSubmit} className={styles.authForm}>
                        <div className={styles.inputGrid}>
                            <input
                                type="text"
                                placeholder="First name*"
                                className={styles.outlineInput}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={loading}
                            />
                            <input
                                type="text"
                                placeholder="Last name*"
                                className={styles.outlineInput}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className={styles.inputContainer}>
                            <input
                                type="email"
                                placeholder="Email*"
                                className={styles.outlineInput}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className={styles.inputGrid}>
                            <input
                                type="password"
                                placeholder="Password*"
                                className={styles.outlineInput}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <input
                                type="password"
                                placeholder="Password confirmation*"
                                className={styles.outlineInput}
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                disabled={loading}
                            />
                        </div>



                        <div className={styles.actionsRow}>
                            <span className={styles.blueLinkBold} onClick={toggleAuthMode}>
                                Sign in
                            </span>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Creating...' : 'Sign me up!'}
                            </button>
                        </div>
                    </form>
                )}
                </div>
            )}
        </div>
    );
};
