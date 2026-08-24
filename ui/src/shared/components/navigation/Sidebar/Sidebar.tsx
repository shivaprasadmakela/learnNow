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
    isDsaActive = false,
    onSelectDsa,
    profile,
    setIsExpanded,
    onOpenDonationModal
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
            <nav className={isExpanded ? styles.navContainer : styles.navContainerCentered} style={{ flexGrow: 1 }}>
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
                {onSelectDsa && (
                    <SidebarNavItem
                        iconClass="fa-solid fa-layer-group"
                        label="DSA Sheet"
                        isActive={isDsaActive}
                        isExpanded={isExpanded}
                        onClick={() => handleNavClick(onSelectDsa)}
                    />
                )}
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

            {onOpenDonationModal && (
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)', width: '100%' }}>
                    <SidebarNavItem
                        iconClass="fa-solid fa-mug-hot"
                        label="Buy Coffee"
                        isActive={false}
                        isExpanded={isExpanded}
                        onClick={() => handleNavClick(onOpenDonationModal)}
                    />
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
