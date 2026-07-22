import React from 'react';
import styles from './WeeklyLeagueBoard.module.css';
import type { WeeklyLeaderboardEntry } from '../../types';

interface LeaderboardRowProps {
    entry: WeeklyLeaderboardEntry;
}

const getInitials = (name: string): string => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const getAvatarColorClass = (userId: string): string => {
    const bgClasses = [
        styles.avatarBgRose,
        styles.avatarBgAmber,
        styles.avatarBgSky,
        styles.avatarBgEmerald,
        styles.avatarBgViolet
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % bgClasses.length;
    return bgClasses[index];
};

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry }) => {
    const initials = getInitials(entry.fullName);
    const avatarBgClass = getAvatarColorClass(entry.userId);

    return (
        <div
            className={`${styles.leaderboardRow} ${entry.isCurrentUser ? styles.currentUserRow : ''}`}
        >
            {entry.isCurrentUser && <span className={styles.activePillIndicator} />}

            <div className={styles.rankMarkerCol}>
                {entry.rank === 1 ? (
                    <div className={styles.rank1Badge}>
                        <i className="fa-solid fa-crown" style={{ fontSize: '0.7rem' }} aria-hidden="true" />
                    </div>
                ) : entry.rank === 2 ? (
                    <div className={styles.rank2Badge}>
                        <i className="fa-solid fa-medal" style={{ fontSize: '0.7rem' }} aria-hidden="true" />
                    </div>
                ) : (
                    <div className={styles.rankNumberText}>
                        #{entry.rank}
                    </div>
                )}
            </div>

            <div className={`${styles.userAvatarInitials} ${avatarBgClass}`}>
                {initials}
            </div>

            <div className={styles.userInfoCol}>
                <div className={styles.userNameRow}>
                    <span className={styles.userNameText}>{entry.fullName}</span>
                    {entry.isCurrentUser && <span className={styles.youTag}>(You)</span>}
                </div>
                {entry.currentStreak > 0 ? (
                    <div className={styles.userStreakRow}>
                        <i className="fa-solid fa-fire" style={{ fontSize: '0.75rem' }} aria-hidden="true" />
                        <span>{entry.currentStreak}d streak</span>
                    </div>
                ) : (
                    <div className={styles.noStreakText}>No active streak</div>
                )}
            </div>

            <div className={styles.pointsPill}>
                {entry.weeklyPoints} <span className={styles.pointsLabel}>pts</span>
            </div>
        </div>
    );
};
