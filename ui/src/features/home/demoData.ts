import type { WeeklyCalendarDay, WeeklyLeaderboardEntry } from '../dashboard/types';

/**
 * The sample data the landing page shows inside real portal components.
 *
 * Shared between the hero cards and the platform tour so the two never drift into showing the
 * same learner with two different streaks.
 */

export const DEMO_WEEKLY_CALENDAR: WeeklyCalendarDay[] = [
    { name: 'Mon', date: '2026-07-20', completed: true, isDotted: false },
    { name: 'Tue', date: '2026-07-21', completed: true, isDotted: false },
    { name: 'Wed', date: '2026-07-22', completed: true, isDotted: false },
    { name: 'Thu', date: '2026-07-23', completed: true, isDotted: false },
    { name: 'Fri', date: '2026-07-24', completed: true, isDotted: false },
    { name: 'Sat', date: '2026-07-25', completed: false, isDotted: true },
    { name: 'Sun', date: '2026-07-26', completed: false, isDotted: true }
];

export const DEMO_LEADERBOARD: WeeklyLeaderboardEntry[] = [
    { userId: '1', fullName: 'Shiva Prasad', avatar: '', weeklyPoints: 480, currentStreak: 7, rank: 1, badge: 'GOLD', isCurrentUser: true },
    { userId: '2', fullName: 'Alex M.', avatar: '', weeklyPoints: 410, currentStreak: 5, rank: 2, badge: 'SILVER', isCurrentUser: false },
    { userId: '3', fullName: 'Priya N.', avatar: '', weeklyPoints: 365, currentStreak: 4, rank: 3, badge: 'NONE', isCurrentUser: false },
    { userId: '4', fullName: 'Dev K.', avatar: '', weeklyPoints: 290, currentStreak: 3, rank: 4, badge: 'NONE', isCurrentUser: false }
];
