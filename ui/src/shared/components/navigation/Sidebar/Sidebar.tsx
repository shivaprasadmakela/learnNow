import React from 'react';
import styles from '../Navigation.module.css';
import type { SidebarProps } from './Sidebar.types';
import { SidebarNavItem } from './components/SidebarNavItem';

export const Sidebar: React.FC<SidebarProps> = ({
    isExpanded,
    activeView,
    changeView,
    isLoggedIn,
    isPathsActive,
    onSelectPaths,
    profile,
    setIsExpanded
}) => {
    const isPrimaryActive = isLoggedIn
        ? (activeView === 'DASHBOARD' || activeView === 'CERTIFICATE') && !isPathsActive
        : (activeView === 'HOME' || activeView === 'COURSE_DETAIL') && !isPathsActive;

    const primaryLabel = isLoggedIn ? 'Dashboard' : 'Home';
    const primaryIcon = isLoggedIn ? 'fa-solid fa-gauge-high' : 'fa-solid fa-house';

    const handleNavClick = (action: () => void) => {
        action();
        if (setIsExpanded && typeof window !== 'undefined' && window.innerWidth <= 768) {
            setIsExpanded(false);
        }
    };

    return (
        <aside className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}>
            <nav className={isExpanded ? styles.navContainer : styles.navContainerCentered}>
                <SidebarNavItem
                    iconClass={primaryIcon}
                    label={primaryLabel}
                    isActive={isPrimaryActive}
                    isExpanded={isExpanded}
                    onClick={() => handleNavClick(() => changeView(isLoggedIn ? 'DASHBOARD' : 'HOME'))}
                />
                <SidebarNavItem
                    iconClass="fa-solid fa-dragon"
                    label="Paths"
                    isActive={isPathsActive}
                    isExpanded={isExpanded}
                    onClick={() => handleNavClick(onSelectPaths)}
                />
                <SidebarNavItem
                    iconClass="fa-solid fa-code"
                    label="Compiler"
                    isActive={activeView === 'COMPILER'}
                    isExpanded={isExpanded}
                    onClick={() => handleNavClick(() => changeView('COMPILER'))}
                />

                {profile?.role === 'ADMIN' && (
                    <SidebarNavItem
                        iconClass="fa-solid fa-shield-halved"
                        label="Admin"
                        isActive={activeView === 'ADMIN'}
                        isExpanded={isExpanded}
                        onClick={() => handleNavClick(() => changeView('ADMIN'))}
                    />
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;
