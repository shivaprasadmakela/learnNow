import React from 'react';
import { 
    HomeIcon, 
    UserIcon,
    PathsIcon
} from '../Icons';
import styles from './Navigation.module.css';

interface SidebarProps {
    isExpanded: boolean;
    activeView: string;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN') => void;
    isLoggedIn: boolean;
    isPathsActive: boolean;
    onSelectPaths: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isExpanded,
    activeView,
    changeView,
    isLoggedIn,
    isPathsActive,
    onSelectPaths
}) => {
    return (
        <aside className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}>
            {isExpanded ? (
                <nav className={styles.navContainer}>
                    {/* Logged Out view: show Home & Paths */}
                    {!isLoggedIn && (
                        <>
                            <div 
                                className={`${styles.navItemExpanded} ${(activeView === 'HOME' || activeView === 'COURSE_DETAIL') && !isPathsActive ? styles.navItemActive : ''}`}
                                onClick={() => changeView('HOME')}
                                title="Home"
                            >
                                <HomeIcon size={20} />
                                <span className={styles.navLabelExpanded}>Home</span>
                            </div>
                            <div 
                                className={`${styles.navItemExpanded} ${isPathsActive ? styles.navItemActive : ''}`}
                                onClick={onSelectPaths}
                                title="Paths"
                            >
                                <PathsIcon size={20} />
                                <span className={styles.navLabelExpanded}>Paths</span>
                            </div>
                        </>
                    )}

                    {/* Logged In view: show Dashboard & Paths */}
                    {isLoggedIn && (
                        <>
                            <div 
                                className={`${styles.navItemExpanded} ${(activeView === 'DASHBOARD' || activeView === 'CERTIFICATE') && !isPathsActive ? styles.navItemActive : ''}`}
                                onClick={() => changeView('DASHBOARD')}
                                title="Dashboard"
                            >
                                <UserIcon size={20} />
                                <span className={styles.navLabelExpanded}>Dashboard</span>
                            </div>
                            <div 
                                className={`${styles.navItemExpanded} ${isPathsActive ? styles.navItemActive : ''}`}
                                onClick={onSelectPaths}
                                title="Paths"
                            >
                                <PathsIcon size={20} />
                                <span className={styles.navLabelExpanded}>Paths</span>
                            </div>
                        </>
                    )}
                </nav>
            ) : (
                <nav className={styles.navContainerCentered}>
                    {/* Logged Out View: show Home & Paths */}
                    {!isLoggedIn && (
                        <>
                            <div 
                                className={styles.navItemCollapsed}
                                onClick={() => changeView('HOME')}
                                title="Home"
                            >
                                <div className={`${styles.iconPill} ${(activeView === 'HOME' || activeView === 'COURSE_DETAIL') && !isPathsActive ? styles.iconPillActive : ''}`}>
                                    <HomeIcon size={20} />
                                </div>
                                <span className={styles.navLabelCollapsed}>Home</span>
                            </div>
                            <div 
                                className={styles.navItemCollapsed}
                                onClick={onSelectPaths}
                                title="Paths"
                            >
                                <div className={`${styles.iconPill} ${isPathsActive ? styles.iconPillActive : ''}`}>
                                    <PathsIcon size={20} />
                                </div>
                                <span className={styles.navLabelCollapsed}>Paths</span>
                            </div>
                        </>
                    )}

                    {/* Logged In View: show Dashboard & Paths */}
                    {isLoggedIn && (
                        <>
                            <div 
                                className={styles.navItemCollapsed}
                                onClick={() => changeView('DASHBOARD')}
                                title="Dashboard"
                            >
                                <div className={`${styles.iconPill} ${(activeView === 'DASHBOARD' || activeView === 'CERTIFICATE') && !isPathsActive ? styles.iconPillActive : ''}`}>
                                    <UserIcon size={20} />
                                </div>
                                <span className={styles.navLabelCollapsed}>Dashboard</span>
                            </div>
                            <div 
                                className={styles.navItemCollapsed}
                                onClick={onSelectPaths}
                                title="Paths"
                            >
                                <div className={`${styles.iconPill} ${isPathsActive ? styles.iconPillActive : ''}`}>
                                    <PathsIcon size={20} />
                                </div>
                                <span className={styles.navLabelCollapsed}>Paths</span>
                            </div>
                        </>
                    )}
                </nav>
            )}
        </aside>
    );
};

export default Sidebar;
