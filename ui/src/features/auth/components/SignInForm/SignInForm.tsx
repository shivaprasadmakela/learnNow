import React from 'react';
import { Button, Input, Checkbox } from '../../../../shared/components';
import styles from '../../styles/LoginPage.module.css';

interface SignInFormProps {
    email: string;
    setEmail: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    rememberMe: boolean;
    setRememberMe: (val: boolean) => void;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onToggleAuthMode: () => void;
    onForgotPassword: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading,
    onSubmit,
    onToggleAuthMode,
    onForgotPassword
}) => {
    return (
        <form onSubmit={onSubmit} className={styles.authForm}>
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
                    onClick={onForgotPassword}
                >
                    Forgot password?
                </span>
            </div>

            <div className={styles.actionsRow}>
                <span className={styles.blueLinkBold} onClick={onToggleAuthMode}>
                    Create account
                </span>
                <Button type="submit" variant="primary" isLoading={loading}>
                    Let's go!
                </Button>
            </div>
        </form>
    );
};
