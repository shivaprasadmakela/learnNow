import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../Toast/Toast';
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
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS') => void;
    profile: UserProfile | null;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isLoggedIn: boolean;
    signOut: () => Promise<void>;
    onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    isExpanded,
    setIsExpanded,
    changeView,
    profile,
    theme,
    toggleTheme,
    isLoggedIn,
    signOut,
    onOpenSettings
}) => {
    const { showToast } = useToast();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close profile menu dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu]);

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
                        {/* Points badge */}
                        <div className={styles.pointsBadge} title="Points">
                            <span className={styles.starIcon}>★</span>
                            <span className={styles.badgeValue}>1656</span>
                        </div>

                        {/* Streak badge */}
                        <div className={styles.streakBadge} title="Current Streak">
                            <svg className={styles.flameIcon} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M12 2S6 7 6 12s4 8 6 8 6-3 6-8-6-10-6-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                            </svg>
                            <span className={styles.badgeValue}>0</span>
                        </div>



                        {/* Avatar button & menu container */}
                        <div className={styles.avatarMenuWrapper} ref={menuRef}>
                            <button className={styles.avatarBtn} onClick={() => setShowProfileMenu(!showProfileMenu)} title="Profile settings">
                                <span className={styles.avatarEmoji}>{profile?.avatar || '👨‍💻'}</span>
                            </button>

                            {/* Toggled Profile Dropdown Card */}
                            {showProfileMenu && (
                                <div className={styles.profileDropdown}>
                                    <div className={styles.profileDropdownHeader}>
                                        <div className={styles.dropdownAvatarCircle}>
                                            <span className={styles.dropdownAvatarEmoji}>{profile?.avatar || '👨‍💻'}</span>
                                        </div>
                                        <div className={styles.headerInfo}>
                                            <h4 className={styles.profileName}>{profile?.fullName || 'Shiva Prasad M'}</h4>
                                            <p className={styles.profileMemberDate}>Member since 2026</p>
                                            <div className={styles.subscriptionRow}>
                                                <span className={styles.tierBadge}>
                                                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style={{ marginRight: '4px' }}>
                                                        <rect x="4" y="4" width="16" height="16" rx="2" />
                                                    </svg>
                                                    Starter
                                                </span>
                                                <span className={styles.buySubscriptionLink} onClick={() => { showToast('Subscription purchases are coming soon!', 'info'); setShowProfileMenu(false); }}>
                                                    Buy subscription
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className={styles.dropdownDivider} />

                                    <div className={styles.menuLinksList}>
                                        <div className={styles.menuItem} onClick={() => { changeView('DASHBOARD'); setShowProfileMenu(false); }}>
                                            <svg className={styles.menuItemIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="7" height="9" />
                                                <rect x="14" y="3" width="7" height="5" />
                                                <rect x="14" y="12" width="7" height="9" />
                                                <rect x="3" y="16" width="7" height="5" />
                                            </svg>
                                            <span>Dashboard</span>
                                        </div>
                                        <div className={styles.menuItem} onClick={() => { showToast('Progress tracking is coming soon!', 'info'); setShowProfileMenu(false); }}>
                                            <svg className={styles.menuItemIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="8" y1="6" x2="21" y2="6" />
                                                <line x1="8" y1="12" x2="21" y2="12" />
                                                <line x1="8" y1="18" x2="21" y2="18" />
                                                <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" />
                                                <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" />
                                                <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" />
                                            </svg>
                                            <span>Progress</span>
                                        </div>
                                        <div className={styles.menuItem} onClick={() => { onOpenSettings?.(); setShowProfileMenu(false); }}>
                                            <svg className={styles.menuItemIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="3" />
                                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                            </svg>
                                            <span>Settings</span>
                                        </div>
                                        <div className={styles.menuItem} onClick={() => { signOut(); setShowProfileMenu(false); }}>
                                            <svg className={styles.menuItemIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                <polyline points="16 17 21 12 16 7" />
                                                <line x1="21" y1="12" x2="9" y2="12" />
                                            </svg>
                                            <span>Sign Out</span>
                                        </div>
                                    </div>

                                    <div className={styles.dropdownFooter}>
                                        <span onClick={() => { showToast('Privacy policy details: Coming soon!', 'info'); setShowProfileMenu(false); }}>Privacy</span>
                                        <span onClick={() => { showToast('Terms of service: Coming soon!', 'info'); setShowProfileMenu(false); }}>Terms</span>
                                    </div>
                                </div>
                            )}
                        </div>
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
