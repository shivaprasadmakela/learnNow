import React from 'react';
import {
    MenuIcon,
    MoonIcon,
    SunIcon
} from '../Icons';
import styles from './Navigation.module.css';

interface UserProfile {
    fullName: string;
    avatar: string;
    role: string;
    bio: string;
}

interface HeaderProps {
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
    changeView: (view: any) => void;
    profile: UserProfile | null;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isLoggedIn: boolean;
    setAuthModalOpen: (val: boolean) => void;
    signOut: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
    isExpanded,
    setIsExpanded,
    changeView,
    profile,
    theme,
    toggleTheme,
    isLoggedIn,
    setAuthModalOpen,
    signOut
}) => {
    const userFirstName = profile?.fullName?.split(' ')[0] ?? 'there';

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button className={styles.menuBtn} onClick={() => setIsExpanded(!isExpanded)} aria-label="Toggle menu">
                    <MenuIcon size={22} />
                </button>
                <div className={styles.logo} onClick={() => changeView('DASHBOARD')}>
                    <span className={styles.logoBrand}>learnNow</span>
                </div>
            </div>

            <div className={styles.headerRight}>
                <button
                    className={styles.headerIconBtn}
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
                </button>

                {isLoggedIn ? (
                    <div className={styles.loggedInContainer}>
                        <button className={styles.signInBtn} onClick={() => changeView('DASHBOARD')}>
                            <span style={{ marginRight: '6px' }}>{profile?.avatar || '👨‍💻'}</span>
                            <span>Hi, {userFirstName}</span>
                        </button>
                        <button className={styles.logoutBtn} onClick={signOut}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <button className={styles.signInBtn} onClick={() => setAuthModalOpen(true)}>
                        Join Academy
                    </button>
                )}
            </div>
        </header>
    );
};
