import React from 'react';
import styles from '../../Navigation.module.css';
import { StreakFlameIcon } from '../../../StreakFlameIcon';

interface StreakBadgeProps {
    streak: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
    return (
        <div className={styles.streakBadge} title="Current Streak">
            <StreakFlameIcon streak={streak} size={22} />
            <span className={styles.badgeValue}>{streak}</span>
        </div>
    );
};
