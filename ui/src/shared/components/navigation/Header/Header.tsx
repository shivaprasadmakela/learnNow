import React from 'react';
import styles from '../Navigation.module.css';
import type { HeaderProps } from './Header.types';
import { ThemeToggle } from './components/ThemeToggle';
import { PointsBadge } from './components/PointsBadge';
import { StreakBadge } from './components/StreakBadge';
import { ProfileMenu } from './components/ProfileMenu';

export const Header: React.FC<HeaderProps> = ({
    isExpanded,
    setIsExpanded,
    changeView,
    profile,
    theme,
    toggleTheme,
    isLoggedIn,
    signOut,
    onOpenSettings,
    points = 0,
    streak = 0
}) => {
    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button
                    className={styles.menuBtn}
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label="Toggle menu"
                >
                    <i className="fa-solid fa-bars" style={{ fontSize: '1.25rem' }} />
                </button>
                <div
                    className={styles.logo}
                    onClick={() => changeView(isLoggedIn ? 'DASHBOARD' : 'HOME')}
                >
                    <span className={styles.logoBrand}>learnNow</span>
                </div>
            </div>

            <div className={styles.headerRight}>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />

                {isLoggedIn ? (
                    <div className={styles.loggedInContainer}>
                        <PointsBadge points={points} />
                        <StreakBadge streak={streak} />
                        <ProfileMenu
                            profile={profile}
                            changeView={changeView}
                            signOut={signOut}
                            onOpenSettings={onOpenSettings}
                        />
                    </div>
                ) : (
                    <button className={styles.signInBtn} onClick={() => changeView('LOGIN')}>
                        Join Academy
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
