import React from 'react';
import styles from '../LearningCard.module.css';

interface CardBadgeProps {
    label?: string;
    icon?: React.ReactNode;
    isCompleted?: boolean;
    variant?: 'normal' | 'green' | 'orange';
}

const renderDefaultBadgeIcon = (label?: string) => {
    if (label && label.toLowerCase().includes('topic')) {
        return <i className="fa-solid fa-layer-group" aria-hidden="true" />;
    }
    return <i className="fa-solid fa-dragon" aria-hidden="true" />;
};

export const CardBadge: React.FC<CardBadgeProps> = ({ label, icon, isCompleted = false, variant }) => {
    if (!label) return null;

    const badgeClass = isCompleted || variant === 'green'
        ? styles.badgePillGreen
        : variant === 'orange'
            ? styles.badgePillOrange
            : styles.badgePill;

    return (
        <div className={badgeClass}>
            <span className={styles.badgeIcon}>
                {icon || renderDefaultBadgeIcon(label)}
            </span>
            <span>{label}</span>
        </div>
    );
};
