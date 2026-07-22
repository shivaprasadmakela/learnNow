import React from 'react';
import styles from '../../Navigation.module.css';

interface PointsBadgeProps {
    points: number;
}

export const PointsBadge: React.FC<PointsBadgeProps> = ({ points }) => {
    return (
        <div className={styles.pointsBadge} title="Total Points">
            <i className="fa-solid fa-star" style={{ color: '#eab308', fontSize: '1rem' }} aria-hidden="true" />
            <span className={styles.badgeValue}>{points}</span>
        </div>
    );
};
