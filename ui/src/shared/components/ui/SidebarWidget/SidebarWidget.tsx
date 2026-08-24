import React from 'react';
import styles from './SidebarWidget.module.css';

export interface SidebarWidgetProps {
    title: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export const SidebarWidget: React.FC<SidebarWidgetProps> = ({
    title,
    icon,
    action,
    children,
    footer,
    className = ''
}) => {
    return (
        <div className={`${styles.widget} ${className}`.trim()}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <h3 className={styles.title}>{title}</h3>
                </div>
                {action && <div className={styles.action}>{action}</div>}
            </div>

            <div className={styles.content}>
                {children}
            </div>

            {footer && <div className={styles.footer}>{footer}</div>}
        </div>
    );
};

export default SidebarWidget;
