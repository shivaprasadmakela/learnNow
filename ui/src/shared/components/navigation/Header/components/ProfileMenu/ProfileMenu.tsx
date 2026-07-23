import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../../../feedback/Toast';
import { Avatar } from '../../../../ui/Avatar';
import styles from '../../../Navigation.module.css';
import type { ProfileMenuProps } from './ProfileMenu.types';

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
    profile,
    changeView,
    signOut,
    onOpenSettings
}) => {
    const { showToast } = useToast();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        <div className={styles.avatarMenuWrapper} ref={menuRef}>
            <button
                className={styles.avatarBtn}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title="Profile settings"
            >
                <Avatar avatar={profile?.avatar} size={32} />
            </button>

            {showProfileMenu && (
                <div className={styles.profileDropdown}>
                    <div className={styles.profileDropdownHeader}>
                        <div className={styles.dropdownAvatarCircle}>
                            <Avatar avatar={profile?.avatar} size={48} />
                        </div>
                        <div className={styles.headerInfo}>
                            <h4 className={styles.profileName}>{profile?.fullName || 'Learner'}</h4>
                            <p className={styles.profileMemberDate}>Member since 2026</p>
                            <div className={styles.subscriptionRow}>
                                <span className={styles.tierBadge}>
                                    <span className={styles.tierBadgeDot} />
                                    Starter
                                </span>
                                <span
                                    className={styles.buySubscriptionLink}
                                    onClick={() => {
                                        showToast('Subscription purchases are coming soon!', 'info');
                                        setShowProfileMenu(false);
                                    }}
                                >
                                    Buy subscription
                                </span>
                            </div>
                        </div>
                    </div>

                    <hr className={styles.dropdownDivider} />

                    <div className={styles.menuLinksList}>
                        <div
                            className={styles.menuItem}
                            onClick={() => {
                                changeView('DASHBOARD');
                                setShowProfileMenu(false);
                            }}
                        >
                            <i className="fa-solid fa-gauge-high" style={{ width: '18px', textAlign: 'center' }} />
                            <span>Dashboard</span>
                        </div>
                        <div
                            className={styles.menuItem}
                            onClick={() => {
                                showToast('Progress tracking is coming soon!', 'info');
                                setShowProfileMenu(false);
                            }}
                        >
                            <i className="fa-solid fa-list-check" style={{ width: '18px', textAlign: 'center' }} />
                            <span>Progress</span>
                        </div>
                        <div
                            className={styles.menuItem}
                            onClick={() => {
                                onOpenSettings?.();
                                setShowProfileMenu(false);
                            }}
                        >
                            <i className="fa-solid fa-gear" style={{ width: '18px', textAlign: 'center' }} />
                            <span>Settings</span>
                        </div>
                        <div
                            className={styles.menuItem}
                            onClick={() => {
                                signOut();
                                setShowProfileMenu(false);
                            }}
                        >
                            <i className="fa-solid fa-right-from-bracket" style={{ width: '18px', textAlign: 'center' }} />
                            <span>Sign Out</span>
                        </div>
                    </div>

                    <div className={styles.dropdownFooter}>
                        <span
                            onClick={() => {
                                showToast('Privacy policy details: Coming soon!', 'info');
                                setShowProfileMenu(false);
                            }}
                        >
                            Privacy
                        </span>
                        <span
                            onClick={() => {
                                showToast('Terms of service: Coming soon!', 'info');
                                setShowProfileMenu(false);
                            }}
                        >
                            Terms
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
