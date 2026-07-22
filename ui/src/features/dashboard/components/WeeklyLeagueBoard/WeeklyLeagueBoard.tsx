import React from 'react';
import styles from './WeeklyLeagueBoard.module.css';
import { LeaderboardRow } from './LeaderboardRow';
import type { WeeklyLeaderboardEntry } from '../../types';

interface WeeklyLeagueBoardProps {
    entries: WeeklyLeaderboardEntry[];
}

export const WeeklyLeagueBoard: React.FC<WeeklyLeagueBoardProps> = ({ entries }) => {
    return (
        <div className={styles.leagueCard}>
            <div className={styles.leagueHeader}>
                <h2 className={styles.leagueTitle}>League</h2>
                <div className={styles.infoIconWrapper}>
                    <i className="fa-solid fa-circle-info" style={{ fontSize: '0.95rem' }} aria-hidden="true" />
                    <div className={styles.tooltipBubble}>Resets every Monday</div>
                </div>
            </div>

            <div className={styles.leaderboardList}>
                {entries.map((entry) => (
                    <LeaderboardRow key={entry.userId} entry={entry} />
                ))}
            </div>
        </div>
    );
};
