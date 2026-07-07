import React, { useState } from 'react';
import { Input } from '../../../shared/components/Input/Input';
import { Button } from '../../../shared/components/Button/Button';
import { BookOpenIcon, AwardIcon, CheckIcon, UserIcon, LockIcon } from '../../../shared/components/Icons';
import styles from './LoginPage.module.css';

interface LoginPageProps {
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (email: string, pass: string, fullName: string) => Promise<unknown>;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ signIn, signUp, changeView }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Form validation states
    const [fullNameError, setFullNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Basic validators
    const validateEmail = (val: string) => {
        if (!val) {
            setEmailError('Email is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (val: string) => {
        if (!val) {
            setPasswordError('Password is required');
            return false;
        }
        if (val.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const validateFullName = (val: string) => {
        if (!val.trim()) {
            setFullNameError('Full name is required');
            return false;
        }
        setFullNameError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isNameValid = isSignUp ? validateFullName(fullName) : true;

        if (!isEmailValid || !isPasswordValid || !isNameValid) {
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                await signUp(email, password, fullName);
                setSuccessMsg('Account created successfully! Check your email to confirm registration or sign in directly if verification is auto-approved.');
                // Clear fields
                setFullName('');
                setEmail('');
                setPassword('');
                // Autofill and switch to sign in for user convenience if needed
                setIsSignUp(false);
            } else {
                await signIn(email, password);
                // Hook state updates activeView & handles navigation to dashboard automatically
            }
        } catch (err: unknown) {
            console.error('Authentication error:', err);
            const message = err instanceof Error ? err.message : 'An error occurred during authentication. Please try again.';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthMode = () => {
        setIsSignUp(!isSignUp);
        setErrorMsg(null);
        setSuccessMsg(null);
        setEmailError('');
        setPasswordError('');
        setFullNameError('');
    };

    return (
        <div className={styles.authPageContainer}>
            <div className={styles.authCard}>
                {/* Left side: Premium Educational Branding Showcase */}
                <div className={styles.showcasePanel}>
                    <div className={styles.showcaseHeader}>
                        <span className={styles.logoBrand} onClick={() => changeView('HOME')}>learnNow</span>
                        <p className={styles.logoTagline}>Professional Developer Academy</p>
                    </div>

                    <div className={styles.showcaseBody}>
                        <h2 className={styles.showcaseTitle}>
                            Build production-ready skills with React & Spring Boot.
                        </h2>
                        
                        <div className={styles.benefitsList}>
                            <div className={styles.benefitItem}>
                                <div className={styles.benefitIcon}>
                                    <BookOpenIcon size={20} />
                                </div>
                                <div className={styles.benefitText}>
                                    <h4>Interactive Certifications</h4>
                                    <p>Follow hand-crafted learning paths designed for modern engineering roles.</p>
                                </div>
                            </div>

                            <div className={styles.benefitItem}>
                                <div className={styles.benefitIcon}>
                                    <AwardIcon size={20} />
                                </div>
                                <div className={styles.benefitText}>
                                    <h4>Verified Accomplishments</h4>
                                    <p>Demonstrate expertise by earning certificates of accomplishment.</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive glass card simulating course dashboard */}
                        <div className={styles.interactiveDemoCard}>
                            <div className={styles.demoCardHeader}>
                                <span className={styles.demoBadge}>ACTIVE COURSE</span>
                                <span className={styles.demoProgress}>80% Complete</span>
                            </div>
                            <h4 className={styles.demoTitle}>React Hook State & Spring APIs</h4>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: '80%' }}></div>
                            </div>
                            <div className={styles.demoFooter}>
                                <span className={styles.checkmarkIcon}><CheckIcon size={12} /> Unit Tests Passed</span>
                                <span className={styles.checkmarkIcon}><CheckIcon size={12} /> Database Connected</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Login / Registration Form */}
                <div className={styles.formPanel}>
                    <div className={styles.formContainer}>
                        <div className={styles.formHeader}>
                            <h3>{isSignUp ? 'Create your account' : 'Welcome back'}</h3>
                            <p className={styles.subtext}>
                                {isSignUp ? 'Start your learning journey today' : 'Log in to continue your education'}
                            </p>
                        </div>

                        {/* Tabs to toggle mode */}
                        <div className={styles.tabContainer}>
                            <button 
                                className={`${styles.tabBtn} ${!isSignUp ? styles.activeTab : ''}`}
                                onClick={() => isSignUp && toggleAuthMode()}
                                type="button"
                            >
                                Sign In
                            </button>
                            <button 
                                className={`${styles.tabBtn} ${isSignUp ? styles.activeTab : ''}`}
                                onClick={() => !isSignUp && toggleAuthMode()}
                                type="button"
                            >
                                Register
                            </button>
                        </div>

                        {errorMsg && (
                            <div className={styles.alertError}>
                                <span className={styles.alertIcon}>⚠️</span>
                                <span className={styles.alertText}>{errorMsg}</span>
                            </div>
                        )}

                        {successMsg && (
                            <div className={styles.alertSuccess}>
                                <span className={styles.alertIcon}>✅</span>
                                <span className={styles.alertText}>{successMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.authForm}>
                            {isSignUp && (
                                <div className={styles.inputWrapper}>
                                    <div className={styles.inputIcon}>
                                        <UserIcon size={18} />
                                    </div>
                                    <Input
                                        label="Full Name"
                                        type="text"
                                        placeholder="Shiva Prasad"
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(e.target.value);
                                            if (fullNameError) validateFullName(e.target.value);
                                        }}
                                        onBlur={(e) => validateFullName(e.target.value)}
                                        error={fullNameError}
                                        className={styles.customInput}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            )}

                            <div className={styles.inputWrapper}>
                                <div className={styles.inputIcon}>
                                    <span>✉️</span>
                                </div>
                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (emailError) validateEmail(e.target.value);
                                    }}
                                    onBlur={(e) => validateEmail(e.target.value)}
                                    error={emailError}
                                    className={styles.customInput}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className={styles.inputWrapper}>
                                <div className={styles.inputIcon}>
                                    <LockIcon size={18} />
                                </div>
                                <div className={styles.passwordFieldContainer}>
                                    <Input
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (passwordError) validatePassword(e.target.value);
                                        }}
                                        onBlur={(e) => validatePassword(e.target.value)}
                                        error={passwordError}
                                        className={styles.customInput}
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                variant="primary" 
                                size="lg" 
                                className={styles.submitBtn}
                                isLoading={loading}
                            >
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </Button>
                        </form>

                        <div className={styles.formFooter}>
                            <button 
                                onClick={() => changeView('HOME')} 
                                className={styles.backHomeBtn}
                                type="button"
                                disabled={loading}
                            >
                                &larr; Back to Catalog
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
