import React, { useState } from 'react';
import { useToast } from '../../../shared/components/feedback/Toast';
import styles from '../styles/LoginPage.module.css';

interface LoginPageProps {
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (firstName: string, lastName: string, email: string, pass: string, dateOfBirth: string) => Promise<unknown>;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'ROADMAP') => void;
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
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    // Date of Birth
    const [dobMonth, setDobMonth] = useState('January');
    const [dobDay, setDobDay] = useState('');
    const [dobYear, setDobYear] = useState('');


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
            const monthMap: Record<string, string> = {
                January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
                July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
            };
            const monthStr = monthMap[dobMonth];
            const dayStr = dobDay.padStart(2, '0');
            const dateOfBirth = `${dobYear}-${monthStr}-${dayStr}`;

            await signUp(firstName.trim(), lastName.trim(), email, password, dateOfBirth);
            setSuccessMsg('Account created successfully! Check your email (or server log) to confirm your registration.');

            // Reset fields
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setPasswordConfirmation('');
            setDobMonth('January');
            setDobDay('');
            setDobYear('');

            // Switch view after successful registration message
            setTimeout(() => {
                setIsSignUp(false);
            }, 3000);
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
