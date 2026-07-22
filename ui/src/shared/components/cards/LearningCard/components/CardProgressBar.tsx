import React from 'react';
import styles from '../LearningCard.module.css';

interface CardProgressBarProps {
    percentage: number;
    containerClassName?: string;
}

export const CardProgressBar: React.FC<CardProgressBarProps> = ({ percentage, containerClassName }) => {
    return (
        <div className={containerClassName || styles.progressContainer}>
            <div className={styles.progressTrack}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className={styles.progressText}>{percentage}%</span>
        </div>
    );
};
