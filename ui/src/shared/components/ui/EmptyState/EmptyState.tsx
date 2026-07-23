import React from 'react';
import { Layers } from 'lucide-react';
import styles from './EmptyState.module.css';
import type { EmptyStateProps } from './EmptyState.types';

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}) => {
    const renderIcon = () => {
        if (!icon) {
            return <Layers size={32} />;
        }
        if (React.isValidElement(icon)) {
            return icon;
        }
        const IconComponent = icon as React.ComponentType<{ size?: number }>;
        return <IconComponent size={32} />;
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={styles.iconWrapper}>
                {renderIcon()}
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
            {actionLabel && onAction && (
                <button type="button" className={styles.actionBtn} onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
