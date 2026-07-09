import React, { useState } from 'react';
import { useToast } from '../../../shared/components/Toast/Toast';
import styles from './LoginPage.module.css';

interface LoginPageProps {
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (email: string, pass: string, fullName: string) => Promise<unknown>;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ signIn, signUp }) => {
    const { showToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

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
    const [company, setCompany] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    // Date of Birth
    const [dobMonth, setDobMonth] = useState('January');
    const [dobDay, setDobDay] = useState('');
    const [dobYear, setDobYear] = useState('');
    const handleGoogleClick = () => {
        showToast('Google Sign In: Coming soon!', 'info');
    };

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
        if (!company.trim()) {
            setErrorMsg('Company name is required.');
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
        if (!dobDay.trim() || !dobYear.trim()) {
            setErrorMsg('Full Date of Birth is required.');
            return;
        }

        const dayNum = parseInt(dobDay, 10);
        const yearNum = parseInt(dobYear, 10);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
            setErrorMsg('Please enter a valid day for date of birth.');
            return;
        }
        const currentYear = new Date().getFullYear();
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
            setErrorMsg('Please enter a valid year for date of birth.');
            return;
        }


        setLoading(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            await signUp(email, password, fullName);
            setSuccessMsg('Account created successfully! Check your email to confirm registration or sign in directly.');

            // Reset fields
            setFirstName('');
            setLastName('');
            setCompany('');
            setEmail('');
            setPassword('');
            setPasswordConfirmation('');
            setDobMonth('January');
            setDobDay('');
            setDobYear('');


            // Switch view
            setIsSignUp(false);
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
            <div className={styles.authCard}>


                <h2 className={styles.viewTitle}>{isSignUp ? 'Create account' : 'Sign in'}</h2>

                {/* Google Button */}
                <button type="button" className={styles.googleBtn} onClick={handleGoogleClick}>
                    <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                        <path
                            fill="#FFFFFF"
                            d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.95-3.24 3.51v2.9h5.1c3.01-2.77 4.8-6.86 4.8-11.64 0-.55-.06-1.12-.17-1.6l-.03.1z"
                        />
                        <path
                            fill="#FFFFFF"
                            d="M12.18 21c2.43 0 4.47-.8 5.96-2.18l-5.1-2.9c-1.39.95-3.19 1.48-5.04 1.25-2.88-.36-5.26-2.58-5.83-5.46A8.995 8.995 0 0012.18 21z"
                        />
                        <path
                            fill="#FFFFFF"
                            d="M2.17 11.71c0-1.13.23-2.22.64-3.23L1.5 5.25a8.995 8.995 0 00-.91 4.54c0 1.6.42 3.1 1.15 4.42l1.31-2.27.02-.23z"
                        />
                        <path
                            fill="#FFFFFF"
                            d="M12.18 3c1.85 0 3.5.64 4.8 1.84l3.58-3.58C18.29.6 15.42 0 12.18 0 7.31 0 3.2 2.76 1.21 6.78l1.31 2.27c1.15-3.52 4.47-6.05 9.66-6.05z"
                        />
                    </svg>
                    <span>{isSignUp ? 'Continue with Google' : 'Sign in with Google'}</span>
                </button>

                <div className={styles.dividerContainer}>
                    <span className={styles.dividerLine}></span>
                    <span className={styles.dividerText}>or</span>
                    <span className={styles.dividerLine}></span>
                </div>



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
                                {loading ? 'Signing in...' : 'Sign in'}
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

                        <div className={styles.inputGrid}>
                            <input
                                type="email"
                                placeholder="Email*"
                                className={styles.outlineInput}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <input
                                type="text"
                                placeholder="Company*"
                                className={styles.outlineInput}
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
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

                        {/* Date of Birth Section */}
                        <div className={styles.dobSection}>
                            <label className={styles.dobLabel}>Date of birth</label>
                            <div className={styles.dobGrid}>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.dobSelect}
                                        value={dobMonth}
                                        onChange={(e) => setDobMonth(e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="January">January</option>
                                        <option value="February">February</option>
                                        <option value="March">March</option>
                                        <option value="April">April</option>
                                        <option value="May">May</option>
                                        <option value="June">June</option>
                                        <option value="July">July</option>
                                        <option value="August">August</option>
                                        <option value="September">September</option>
                                        <option value="October">October</option>
                                        <option value="November">November</option>
                                        <option value="December">December</option>
                                    </select>
                                    <span className={styles.selectArrow}>▼</span>
                                    <span className={styles.floatingSelectLabel}>Month *</span>
                                </div>
                                <div className={styles.dobInputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Day *"
                                        className={styles.dobInput}
                                        value={dobDay}
                                        onChange={(e) => setDobDay(e.target.value.replace(/\D/g, ''))}
                                        maxLength={2}
                                        disabled={loading}
                                    />
                                    <span className={styles.floatingInputLabel}>Day *</span>
                                </div>
                                <div className={styles.dobInputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Year *"
                                        className={styles.dobInput}
                                        value={dobYear}
                                        onChange={(e) => setDobYear(e.target.value.replace(/\D/g, ''))}
                                        maxLength={4}
                                        disabled={loading}
                                    />
                                    <span className={styles.floatingInputLabel}>Year *</span>
                                </div>
                            </div>
                            <p className={styles.dobHint}>
                                Your date of birth will only be used to determine eligibility to use the service.
                            </p>
                        </div>


                        <div className={styles.actionsRow}>
                            <span className={styles.blueLinkBold} onClick={toggleAuthMode}>
                                Sign in
                            </span>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Creating...' : 'Create account'}
                            </button>
                        </div>
                    </form>
                )}


            </div>
        </div>
    );
};
