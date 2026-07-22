import React from 'react';
import styles from '../LearningCard.module.css';

export const CardCompletedBadge: React.FC = () => {
    return (
        <div className={styles.completedBadgeWrapper}>
            <div className={styles.completedBadge} title="Completed!">
                <i className="fa-solid fa-hands-clapping" style={{ fontSize: '1rem', color: 'var(--tech-green, #16a34a)' }} aria-hidden="true" />
            </div>
            <div className={styles.tooltipBubble}>Completed!</div>
        </div>
    );
};
