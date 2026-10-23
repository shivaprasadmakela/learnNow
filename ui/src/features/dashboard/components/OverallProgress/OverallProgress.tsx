import React from 'react';
import styles from '../../styles/Dashboard.module.css';

interface OverallProgressProps {
    streak?: number;
    points?: number;
    /**
     * Both counts come with the dashboard response. They used to be worked out from the path list,
     * which the dashboard only holds once the Paths tab has been opened - so both read 0 until then.
     */
    publishedPaths?: number;
    completedPaths?: number;
}

export const OverallProgress: React.FC<OverallProgressProps> = ({
    streak = 0,
    points = 0,
    publishedPaths = 0,
    completedPaths = 0
}) => {

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
                    <span className={styles.progressValue}>{publishedPaths || '—'}</span>
                </div>
                <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>
                        <i className="fa-solid fa-dragon" style={{ color: 'var(--tech-green)', marginRight: '8px' }} aria-hidden="true" />
                        Completed Paths
                    </span>
                    <span className={styles.progressValue}>{completedPaths}</span>
                </div>
            </div>
        </div>
    );
};
