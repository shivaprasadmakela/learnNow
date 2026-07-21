import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../feedback/Toast';
import { Menu, Moon, Sun, Star, Flame, LayoutDashboard, ListTodo, Settings, LogOut } from 'lucide-react';
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
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'ROADMAP') => void;
    profile: UserProfile | null;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isLoggedIn: boolean;
    signOut: () => Promise<void>;
    onOpenSettings?: () => void;
    points?: number;
    streak?: number;
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
    onOpenSettings,
    points = 0,
    streak = 0
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
                    <Menu size={22} />
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
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {isLoggedIn ? (
                    <div className={styles.loggedInContainer}>
                        {/* Points badge */}
                        <div className={styles.pointsBadge} title="Total Points">
                            <Star size={16} fill="#eab308" stroke="#ca8a04" />
                            <span className={styles.badgeValue}>{points}</span>
                        </div>

                        {/* Streak badge */}
                        <div className={styles.streakBadge} title="Current Streak">
                            <Flame size={16} fill="#f97316" stroke="#ea580c" />
                            <span className={styles.badgeValue}>{streak}</span>
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
                                                    <span className={styles.tierBadgeDot}></span>
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
                                            <LayoutDashboard className={styles.menuItemIcon} size={18} />
                                            <span>Dashboard</span>
                                        </div>
                                        <div className={styles.menuItem} onClick={() => { showToast('Progress tracking is coming soon!', 'info'); setShowProfileMenu(false); }}>
                                            <ListTodo className={styles.menuItemIcon} size={18} />
                                            <span>Progress</span>
                                        </div>
                                        <div className={styles.menuItem} onClick={() => { onOpenSettings?.(); setShowProfileMenu(false); }}>
                                            <Settings className={styles.menuItemIcon} size={18} />
                                            <span>Settings</span>
                                        </div>
                                        <div className={styles.menuItem} onClick={() => { signOut(); setShowProfileMenu(false); }}>
                                            <LogOut className={styles.menuItemIcon} size={18} />
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
