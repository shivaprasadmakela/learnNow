import React from 'react';
import styles from '../LearningCard.module.css';

interface CardBadgeProps {
    label?: string;
    icon?: React.ReactNode;
}

const renderDefaultBadgeIcon = (label?: string) => {
    if (label && label.toLowerCase().includes('path')) {
        return <i className="fa-solid fa-dragon" aria-hidden="true" />;
    }
    return <i className="fa-solid fa-dove" aria-hidden="true" />;
};

export const CardBadge: React.FC<CardBadgeProps> = ({ label, icon }) => {
    if (!label) return null;

    return (
        <div className={styles.badgePill}>
            <span className={styles.badgeIcon}>
                {icon || renderDefaultBadgeIcon(label)}
            </span>
            <span>{label}</span>
        </div>
    );
};
