import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn, LayoutDashboard } from 'lucide-react';
import styles from './UnauthorizedAccess.module.css';

interface UnauthorizedAccessProps {
    changeView: (view: string) => void;
    isLoggedIn: boolean;
}

export const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({ changeView, isLoggedIn }) => {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconCircle}>
                    <ShieldAlert size={44} className={styles.shieldIcon} />
                </div>

                <span className={styles.codeBadge}>403 FORBIDDEN</span>

                <h1 className={styles.title}>Unauthorized Access</h1>

                <p className={styles.description}>
                    You do not have permission to access Administrator features.
                    {isLoggedIn
                        ? ' Your account does not have administrator privileges.'
                        : ' Please sign in with an administrator account to continue.'}
                </p>

                <div className={styles.actions}>
                    {isLoggedIn ? (
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => changeView('DASHBOARD')}
                        >
                            <LayoutDashboard size={16} /> Return to Dashboard
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => changeView('LOGIN')}
                        >
                            <LogIn size={16} /> Sign In
                        </button>
                    )}

                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => changeView('HOME')}
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};
