import React from 'react';
import styles from '../styles/LoginPage.module.css';
import { useAuthForm } from '../hooks/useAuthForm';
import { SignInForm } from '../components/SignInForm';
import { SignUpForm } from '../components/SignUpForm';
import { RegistrationSuccess } from '../components/RegistrationSuccess';

export interface LoginPageProps {
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (firstName: string, lastName: string, email: string, pass: string) => Promise<unknown>;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ signIn, signUp }) => {
    const form = useAuthForm({ signIn, signUp });

    return (
        <div className={styles.authPageContainer}>
            {form.isRegisteredSuccess ? (
                <RegistrationSuccess
                    onContinue={() => {
                        form.setIsRegisteredSuccess(false);
                        form.setIsSignUp(false);
                    }}
                />
            ) : (
                <div className={styles.authCard}>
                    <h2 className={styles.viewTitle}>
                        {form.isSignUp ? "Join the squad! Let's get building." : "Hey, welcome back!"}
                    </h2>

                    {!form.isSignUp ? (
                        <SignInForm
                            email={form.email}
                            setEmail={form.setEmail}
                            password={form.password}
                            setPassword={form.setPassword}
                            rememberMe={form.rememberMe}
                            setRememberMe={form.setRememberMe}
                            loading={form.loading}
                            onSubmit={form.handleSignInSubmit}
                            onToggleAuthMode={form.toggleAuthMode}
                            onForgotPassword={() => form.showToast('Forgot password logic is coming soon!', 'info')}
                        />
                    ) : (
                        <SignUpForm
                            firstName={form.firstName}
                            setFirstName={form.setFirstName}
                            lastName={form.lastName}
                            setLastName={form.setLastName}
                            email={form.email}
                            setEmail={form.setEmail}
                            password={form.password}
                            setPassword={form.setPassword}
                            passwordConfirmation={form.passwordConfirmation}
                            setPasswordConfirmation={form.setPasswordConfirmation}
                            loading={form.loading}
                            onSubmit={form.handleSignUpSubmit}
                            onToggleAuthMode={form.toggleAuthMode}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default LoginPage;
