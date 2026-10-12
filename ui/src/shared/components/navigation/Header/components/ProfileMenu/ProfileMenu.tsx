import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Avatar } from '../../../../ui/Avatar';
import styles from './ProfileMenu.module.css';
import type { ProfileMenuProps } from './ProfileMenu.types';

/**
 * The avatar button and the account popover behind it.
 *
 * It only holds what is not already one click away. The sidebar carries Dashboard, Paths, DSA,
 * the compiler and Admin, and the header carries the theme toggle, points and streak - repeating
 * any of them here was noise. What is left is the account itself: who is signed in, the page that
 * manages their profile and data, the privacy notice, and signing out.
 *
 * It behaves as a menu button should: Escape closes it and returns focus to the avatar, the arrow
 * keys, Home and End move between items, Tab or a click outside closes it.
 */
export const ProfileMenu: React.FC<ProfileMenuProps> = ({ profile, changeView, signOut }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuId = useId();

    const close = useCallback((returnFocus: boolean) => {
        setOpen(false);
        if (returnFocus) triggerRef.current?.focus();
    }, []);

    const items = () =>
        Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

    useEffect(() => {
        if (!open) return;
        // The first item takes focus, so keyboard users land inside the menu they opened.
        items()[0]?.focus();

        const onPointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) close(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open, close]);

    const onMenuKeyDown = (event: React.KeyboardEvent) => {
        const list = items();
        const index = list.indexOf(document.activeElement as HTMLElement);
        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                close(true);
                break;
            case 'ArrowDown':
                event.preventDefault();
                list[(index + 1) % list.length]?.focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                list[(index - 1 + list.length) % list.length]?.focus();
                break;
            case 'Home':
                event.preventDefault();
                list[0]?.focus();
                break;
            case 'End':
                event.preventDefault();
                list[list.length - 1]?.focus();
                break;
            case 'Tab':
                close(false);
                break;
        }
    };

    const go = (view: 'PROFILE' | 'PRIVACY') => {
        close(false);
        changeView(view);
    };

    const name = profile?.fullName?.trim() || 'Learner';
    const isAdmin = profile?.role?.toUpperCase() === 'ADMIN';

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <button
                ref={triggerRef}
                type="button"
                className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
                onClick={() => setOpen(value => !value)}
                onKeyDown={event => {
                    if (event.key === 'ArrowDown' && !open) {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                aria-label="Account menu"
                title="Account"
            >
                <Avatar avatar={profile?.avatar} size={32} />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    id={menuId}
                    role="menu"
                    aria-label="Account"
                    className={styles.menu}
                    onKeyDown={onMenuKeyDown}
                >
                    <div className={styles.identity}>
                        <span className={styles.identityAvatar}>
                            <Avatar avatar={profile?.avatar} size={44} />
                        </span>
                        <div className={styles.identityText}>
                            <span className={styles.name} title={name}>
                                {name}
                                {isAdmin && <span className={styles.roleBadge}>Admin</span>}
                            </span>
                            {profile?.email && (
                                <span className={styles.email} title={profile.email}>
                                    {profile.email}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.group} role="none">
                        <button
                            type="button"
                            role="menuitem"
                            className={styles.item}
                            onClick={() => go('PROFILE')}
                        >
                            <UserRound size={16} aria-hidden="true" />
                            <span className={styles.itemText}>
                                <span>Profile &amp; privacy</span>
                                <span className={styles.itemHint}>
                                    Name, avatar, consents and your data
                                </span>
                            </span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className={styles.item}
                            onClick={() => go('PRIVACY')}
                        >
                            <ShieldCheck size={16} aria-hidden="true" />
                            <span className={styles.itemText}>
                                <span>Privacy notice</span>
                            </span>
                        </button>
                    </div>

                    <div className={styles.group} role="none">
                        <button
                            type="button"
                            role="menuitem"
                            className={`${styles.item} ${styles.itemSignOut}`}
                            onClick={() => {
                                close(false);
                                void signOut();
                            }}
                        >
                            <LogOut size={16} aria-hidden="true" />
                            <span className={styles.itemText}>
                                <span>Sign out</span>
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
