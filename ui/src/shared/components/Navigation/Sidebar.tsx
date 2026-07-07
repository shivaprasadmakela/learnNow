import React from 'react';
import { 
    HomeIcon, 
    UserIcon
} from '../Icons';
import styles from './Navigation.module.css';

interface SidebarProps {
    isExpanded: boolean;
    activeView: string;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN') => void;
    isLoggedIn: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isExpanded,
    activeView,
    changeView,
    isLoggedIn
}) => {
    return (
        <aside className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}>
            {isExpanded ? (
                <nav className={styles.navContainer}>
                    {/* Logged Out view: show Home */}
                    {!isLoggedIn && (
                        <div 
                            className={`${styles.navItemExpanded} ${(activeView === 'HOME' || activeView === 'COURSE_DETAIL') ? styles.navItemActive : ''}`}
                            onClick={() => changeView('HOME')}
                            title="Home"
                        >
                            <HomeIcon size={20} />
                            <span className={styles.navLabelExpanded}>Home</span>
                        </div>
                    )}

                    {/* Logged In view: show Dashboard */}
                    {isLoggedIn && (
                        <div 
                            className={`${styles.navItemExpanded} ${(activeView === 'DASHBOARD' || activeView === 'CERTIFICATE') ? styles.navItemActive : ''}`}
                            onClick={() => changeView('DASHBOARD')}
                            title="Dashboard"
                        >
                            <UserIcon size={20} />
                            <span className={styles.navLabelExpanded}>Dashboard</span>
                        </div>
                    )}

                </nav>
            ) : (
                <nav className={styles.navContainerCentered}>
                    {/* Logged Out View: show Home */}
                    {!isLoggedIn && (
                        <div 
                            className={styles.navItemCollapsed}
                            onClick={() => changeView('HOME')}
                            title="Home"
                        >
                            <div className={`${styles.iconPill} ${(activeView === 'HOME' || activeView === 'COURSE_DETAIL') ? styles.iconPillActive : ''}`}>
                                <HomeIcon size={20} />
                            </div>
                            <span className={styles.navLabelCollapsed}>Home</span>
                        </div>
                    )}

                    {/* Logged In View: show Dashboard */}
                    {isLoggedIn && (
                        <div 
                            className={styles.navItemCollapsed}
                            onClick={() => changeView('DASHBOARD')}
                            title="Dashboard"
                        >
                            <div className={`${styles.iconPill} ${(activeView === 'DASHBOARD' || activeView === 'CERTIFICATE') ? styles.iconPillActive : ''}`}>
                                <UserIcon size={20} />
                            </div>
                            <span className={styles.navLabelCollapsed}>Dashboard</span>
                        </div>
                    )}

                </nav>
            )}
        </aside>
    );
};
