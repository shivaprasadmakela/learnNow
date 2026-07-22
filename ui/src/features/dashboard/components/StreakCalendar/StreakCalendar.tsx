import React from 'react';
import styles from './StreakCalendar.module.css';
import { StreakFlameIcon } from '../../../../shared/components/StreakFlameIcon';
import type { WeeklyCalendarDay } from '../../types';

interface StreakCalendarProps {
    currentStreak: number;
    weeklyCalendar: WeeklyCalendarDay[];
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({ currentStreak, weeklyCalendar }) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return (
        <div className={styles.streakCard}>
            <div className={styles.streakInfo}>
                <span className={styles.streakBigNumber}>
                    {String(currentStreak).split('').map((digit, idx) => (
                        <i key={idx} className={`fa-regular fa-${digit}`} aria-hidden="true" />
                    ))}
                </span>
                <div className={styles.streakFlameStack}>
                    <StreakFlameIcon streak={currentStreak} size={56} className={styles.streakCanvas} />
                    <div className={styles.streakSubLabel}>
                        Current<br />streak
                    </div>
                </div>
            </div>

            <div className={styles.streakDivider} />

            <div className={styles.weekCalendar}>
                {weeklyCalendar.map((day, idx) => {
                    const isToday = day.date === todayStr;
                    return (
                        <div key={idx} className={styles.calendarDay}>
                            <div
                                className={`${styles.dayIndicatorCircle} ${day.completed
                                    ? styles.dayCircleActive
                                    : isToday
                                        ? styles.dayCircleToday
                                        : day.isDotted
                                            ? styles.dayCircleDotted
                                            : ''
                                    }`}
                            >
                                {day.completed && <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }} aria-hidden="true" />}
                            </div>
                            <span className={`${styles.calendarDayLabel} ${isToday ? styles.calendarDayLabelToday : ''}`}>
                                {day.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
