import React from 'react';
import {
    MenuIcon,
    MoonIcon,
    SunIcon,
    SearchIcon
} from '../Icons';
import type { UserProgress } from '../../../features/learning/types';
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
    activeView: string;
    changeView: (view: any) => void;
    profile: UserProfile | null;
    progress: UserProgress[];
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isLoggedIn: boolean;
    setAuthModalOpen: (val: boolean) => void;
    signOut: () => Promise<void>;
}

const FlameIcon = ({ size = 20, active = false }: { size?: number; active?: boolean }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? "url(#flameGradHeader)" : "none"}
        stroke={active ? "#ea580c" : "var(--text-tertiary)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: active ? 'drop-shadow(0 1px 3px rgba(234, 88, 12, 0.3))' : 'none' }}
    >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
        {active && (
            <defs>
                <linearGradient id="flameGradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
            </defs>
        )}
    </svg>
);

const StarIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#eab308" stroke="#ca8a04" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

export const Header: React.FC<HeaderProps> = ({
    isExpanded,
    setIsExpanded,
    activeView,
    changeView,
    profile,
    progress,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    isLoggedIn,
    setAuthModalOpen,
    signOut
}) => {
    const userFirstName = profile?.fullName?.split(' ')[0] ?? 'there';

    // XP & Streak Calculation
    const completedCount = progress.filter(p => p.completed).length;
    const hasCompletionOnDay = (date: Date) => {
        const dateStr = date.toDateString();
        return progress.some(p => {
            if (!p.completed || !p.completedAt) return false;
            const completedDate = new Date(p.completedAt);
            return completedDate.toDateString() === dateStr;
        });
    };

    let calculatedStreak = 0;
    const today = new Date();
    const checkDate = new Date(today);
    let active = hasCompletionOnDay(checkDate);
    if (active) {
        calculatedStreak = 1;
        while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            if (hasCompletionOnDay(checkDate)) {
                calculatedStreak++;
            } else {
                break;
            }
        }
    } else {
        checkDate.setDate(checkDate.getDate() - 1);
        if (hasCompletionOnDay(checkDate)) {
            calculatedStreak = 1;
            while (true) {
                checkDate.setDate(checkDate.getDate() - 1);
                if (hasCompletionOnDay(checkDate)) {
                    calculatedStreak++;
                } else {
                    break;
                }
            }
        }
    }
    const currentStreak = calculatedStreak || (completedCount > 0 ? 1 : 0);

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button className={styles.menuBtn} onClick={() => setIsExpanded(!isExpanded)} aria-label="Toggle menu">
                    <MenuIcon size={22} />
                </button>
                <div className={styles.logo} onClick={() => changeView(isLoggedIn ? 'DASHBOARD' : 'HOME')}>
                    <span className={styles.logoBrand}>learnNow</span>

                </div>
            </div>

            {(activeView === 'HOME' || activeView === 'DASHBOARD') && (
                <div className={styles.headerSearchContainer}>
                    <SearchIcon size={18} className={styles.headerSearchIcon} />
                    <input
                        type="text"
                        className={styles.headerSearch}
                        placeholder="What do you want to learn today?"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            <div className={styles.headerRight}>
                {isLoggedIn && (
                    <div className={styles.headerStatsRow}>
                        <div className={styles.headerStatBadge} title={`${completedCount * 150} XP earned`}>
                            <StarIcon size={16} />
                            <span className={styles.headerStatValue}>{completedCount * 150}</span>
                        </div>
                        <div className={styles.headerStatBadge} title={`${currentStreak} days streak`}>
                            <FlameIcon size={18} active={currentStreak > 0} />
                            <span className={styles.headerStatValue}>{currentStreak}</span>
                        </div>
                    </div>
                )}

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
