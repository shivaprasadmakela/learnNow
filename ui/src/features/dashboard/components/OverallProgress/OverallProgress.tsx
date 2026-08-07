import React from 'react';
import styles from '../../styles/Dashboard.module.css';
import type { Course } from '../../../../types';

interface OverallProgressProps {
    courses?: Course[];
    streak?: number;
    points?: number;
}

export const OverallProgress: React.FC<OverallProgressProps> = ({ courses = [], streak = 0, points = 0 }) => {
    const totalPathsCount = courses.length;
    const completedPathsCount = courses.filter(c => (c.progressPercentage || 0) === 100).length;

    return (
        <div className={styles.progressCard}>
            <h3 className={styles.cardHeaderTitle} style={{ marginBottom: '16px' }}>Overall Progress</h3>
            <div className={styles.progressStatsGrid}>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-fire" style={{ color: 'var(--tech-orange)', marginRight: '8px' }} aria-hidden="true" />
                        Current Streak
                    </span>
                    <span className={styles.progressValue}>{streak} days</span>
                </div>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-star" style={{ color: 'var(--tech-gold)', marginRight: '8px' }} aria-hidden="true" />
                        Total XP Points
                    </span>
                    <span className={styles.progressValue}>{points}</span>
                </div>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-dragon" style={{ color: 'var(--text-primary)', marginRight: '8px' }} aria-hidden="true" />
                        Available Paths
                    </span>
                    <span className={styles.progressValue}>{totalPathsCount || '—'}</span>
                </div>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-dragon" style={{ color: 'var(--tech-green)', marginRight: '8px' }} aria-hidden="true" />
                        Completed Paths
                    </span>
                    <span className={styles.progressValue}>{completedPathsCount}</span>
                </div>
            </div>
        </div>
    );
};
