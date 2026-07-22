import React from 'react';
import styles from '../../styles/Dashboard.module.css';
import type { PathProgressSummary } from '../../types';

interface OverallProgressProps {
    paths: PathProgressSummary[];
}

export const OverallProgress: React.FC<OverallProgressProps> = ({ paths }) => {
    const totalPathsCount = paths.length;
    const completedPathsCount = paths.filter(p => p.progressPercentage === 100).length;
    const completedTopicsCount = paths.reduce((sum, p) => sum + p.completedTopicsCount, 0);
    const totalTopicsCount = paths.reduce((sum, p) => sum + p.totalTopicsCount, 0);

    return (
        <div className={styles.progressCard}>
            <h3 className={styles.cardHeaderTitle} style={{ marginBottom: '16px' }}>Overall Progress</h3>
            <div className={styles.progressStatsGrid}>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-dragon" style={{ color: 'var(--text-primary)', marginRight: '8px' }} aria-hidden="true" />
                        Active Paths
                    </span>
                    <span className={styles.progressValue}>{totalPathsCount}</span>
                </div>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-dragon" style={{ color: 'var(--tech-green)', marginRight: '8px' }} aria-hidden="true" />
                        Completed Paths
                    </span>
                    <span className={styles.progressValue}>{completedPathsCount}</span>
                </div>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-dove" style={{ color: 'var(--text-primary)', marginRight: '8px' }} aria-hidden="true" />
                        Total Topics
                    </span>
                    <span className={styles.progressValue}>{totalTopicsCount}</span>
                </div>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-dove" style={{ color: 'var(--tech-green)', marginRight: '8px' }} aria-hidden="true" />
                        Completed Topics
                    </span>
                    <span className={styles.progressValue}>{completedTopicsCount}</span>
                </div>
            </div>
        </div>
    );
};
