import React from 'react';
import { 
    MenuIcon,
    MoonIcon,
    SunIcon,
    GlobeIcon,
    HelpIcon,
    SearchIcon
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
    activeView: string;
    changeView: (view: any) => void;
    profile: UserProfile | null;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isLoggedIn: boolean;
    setAuthModalOpen: (val: boolean) => void;
    signOut: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
    isExpanded,
    setIsExpanded,
    activeView,
    changeView,
    profile,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
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
                <div className={styles.logo} onClick={() => changeView(isLoggedIn ? 'DASHBOARD' : 'HOME')}>
                    <span className={styles.logoBrand}>Bugfix</span>
                    <span className={`${styles.logoAcademy} ${styles.hideOnMobile}`}>Academy</span>
                </div>
            </div>

            {activeView === 'HOME' && (
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
                <button
                    className={styles.headerIconBtn}
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
                </button>
                <button className={`${styles.headerIconBtn} ${styles.hideOnMobile}`}><GlobeIcon size={20} /></button>
                <button className={`${styles.headerIconBtn} ${styles.hideOnMobile}`}><HelpIcon size={20} /></button>
                
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
