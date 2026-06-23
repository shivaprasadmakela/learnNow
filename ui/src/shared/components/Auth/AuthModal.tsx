import React, { useState } from 'react';
import { LockIcon, UserIcon, SignInIcon } from '../Icons';
import styles from './AuthModal.module.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    signUp: (email: string, pass: string, fullName: string) => Promise<any>;
    signIn: (email: string, pass: string) => Promise<any>;
    signInWithGoogle: () => Promise<any>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    signUp,
    signIn,
    signInWithGoogle
}) => {
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (isSignUpMode) {
                if (!fullName.trim()) {
                    throw new Error("Full Name is required for signing up.");
                }
                await signUp(email, password, fullName);
                setSuccessMsg("Verification email sent! Check your inbox to verify your account.");
                // Reset fields
                setEmail('');
                setPassword('');
                setFullName('');
            } else {
                await signIn(email, password);
                onClose();
            }
        } catch (err: any) {
            console.error("Authentication action failed:", err);
            setErrorMsg(err.message || "An authentication error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            console.error("Google login failed:", err);
            setErrorMsg(err.message || "Failed to initialize Google login.");
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    &times;
                </button>

                <div className={styles.modalHeader}>
                    <div className={styles.logoTitle}>LEARN WITH SHIVA</div>
                    <p className={styles.subtitle}>
                        {isSignUpMode 
                            ? "Start your journey in React & Spring Boot" 
                            : "Welcome back to your learning space"}
                    </p>
                </div>

                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${!isSignUpMode ? styles.activeTab : ''}`}
                        onClick={() => {
                            setIsSignUpMode(false);
                            setErrorMsg(null);
                            setSuccessMsg(null);
                        }}
                    >
                        Sign In
                    </button>
                    <button 
                        className={`${styles.tab} ${isSignUpMode ? styles.activeTab : ''}`}
                        onClick={() => {
                            setIsSignUpMode(true);
                            setErrorMsg(null);
                            setSuccessMsg(null);
                        }}
                    >
                        Register
                    </button>
                </div>

                {errorMsg && (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        <span>⚠️</span>
                        <div>{errorMsg}</div>
                    </div>
                )}

                {successMsg && (
                    <div className={`${styles.alert} ${styles.alertSuccess}`}>
                        <span>✅</span>
                        <div>{successMsg}</div>
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    {isSignUpMode && (
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Full Name</label>
                            <div className={styles.inputWrapper}>
                                <div className={styles.inputIcon}>
                                    <UserIcon size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Alex Learner"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={styles.inputField}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Email Address</label>
                        <div className={styles.inputWrapper}>
                            <div className={styles.inputIcon}>
                                <UserIcon size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="learner@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.inputField}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Password</label>
                        <div className={styles.inputWrapper}>
                            <div className={styles.inputIcon}>
                                <LockIcon size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.inputField}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitBtn} 
                        disabled={loading}
                    >
                        {loading ? (
                            <div className={styles.spinner}></div>
                        ) : (
                            <>
                                <SignInIcon size={18} />
                                <span>{isSignUpMode ? "Register & Verify" : "Sign In"}</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.divider}>or</div>

                <button 
                    onClick={handleGoogleSignIn}
                    className={styles.googleBtn} 
                    disabled={loading}
                >
                    <svg className={styles.googleIcon} viewBox="0 0 24 24">
                        <path
                            fill="#EA4335"
                            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.64 5.64 0 0 1 8.23 12.8a5.64 5.64 0 0 1 5.76-5.8c1.558 0 2.972.618 4.025 1.62l3.1-3.1C19.14 3.558 15.93 2 12.24 2 6.8 2 2.4 6.4 2.4 11.8s4.4 9.8 9.84 9.8c5.44 0 9.84-4.4 9.84-9.8 0-.686-.068-1.354-.2-2.015H12.24Z"
                        />
                    </svg>
                    <span>Continue with Google</span>
                </button>
            </div>
        </div>
    );
};
