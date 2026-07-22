import React from 'react';
import styles from '../../Navigation.module.css';

interface SidebarNavItemProps {
    iconClass: string;
    label: string;
    isActive: boolean;
    isExpanded: boolean;
    onClick: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
    iconClass,
    label,
    isActive,
    isExpanded,
    onClick
}) => {
    if (isExpanded) {
        return (
            <div
                className={`${styles.navItemExpanded} ${isActive ? styles.navItemActive : ''}`}
                onClick={onClick}
                title={label}
            >
                <i className={iconClass} style={{ fontSize: '1.1rem', width: '20px', textAlign: 'center' }} aria-hidden="true" />
                <span className={styles.navLabelExpanded}>{label}</span>
            </div>
        );
    }

    return (
        <div className={styles.navItemCollapsed} onClick={onClick} title={label}>
            <div className={`${styles.iconPill} ${isActive ? styles.iconPillActive : ''}`}>
                <i className={iconClass} style={{ fontSize: '1.1rem' }} aria-hidden="true" />
            </div>
            <span className={styles.navLabelCollapsed}>{label}</span>
        </div>
    );
};
