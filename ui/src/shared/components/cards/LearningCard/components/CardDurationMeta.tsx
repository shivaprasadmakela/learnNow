import React from 'react';
import styles from '../LearningCard.module.css';

interface CardDurationMetaProps {
    duration?: string;
    footerText?: string;
}

export const CardDurationMeta: React.FC<CardDurationMetaProps> = ({ duration, footerText }) => {
    if (duration) {
        return (
            <div className={styles.footerMeta}>
                <i className="fa-regular fa-clock" style={{ fontSize: '0.9rem' }} aria-hidden="true" />
                <span>{duration}</span>
            </div>
        );
    }

    return (
        <div className={styles.footerMeta}>
            <span>{footerText || 'Managed by LearnNow'}</span>
        </div>
    );
};
