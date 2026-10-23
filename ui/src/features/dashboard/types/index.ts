import type { NextLesson } from '../../../types';
export interface WeeklyCalendarDay {
    name: string;
    date: string;
    completed: boolean;
    isDotted: boolean;
}

export interface RecentTopicActivity {
    topicId: number;
    topicTitle: string;
    pathId: number;
    pathTitle: string;
    progressPercentage: number;
    completed: boolean;
    lastActivityAt: string;
}

/**
 * The dashboard's next-step card, decided by the server. CONTINUE: an unfinished path you were
 * working on. NEXT: you finished a path, and this one follows it. START: nothing begun yet.
 * DONE: every path finished. `nextLesson` is what the button opens; null only for DONE.
 */
export interface DashboardBanner {
    type: 'CONTINUE' | 'NEXT' | 'START' | 'DONE';
    pathId?: string | null;
    pathTitle: string;
    pathDescription: string;
    pathCategory?: string | null;
    /** Why this card; null for CONTINUE, whose label already says it. */
    reason: string | null;
    nextLesson: NextLesson | null;
}

/** Other learners' ids are not sent; `isCurrentUser` marks the viewer's own row. */
export interface WeeklyLeaderboardEntry {
    fullName: string;
    avatar?: string;
    weeklyPoints: number;
    currentStreak: number;
    rank: number;
    badge: 'GOLD' | 'SILVER' | 'NONE';
    isCurrentUser: boolean;
}

export interface DashboardResponse {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    timezone: string;
    weeklyCalendar: WeeklyCalendarDay[];
    recentTopics: RecentTopicActivity[];
    banner: DashboardBanner;
    weeklyLeaderboard?: WeeklyLeaderboardEntry[];
    currentUserRank?: number;
    currentUserWeeklyPoints?: number;
    /** Every published path - the overall card's "available" figure. */
    publishedPathsCount: number;
    /** Paths this learner has finished, by the same 100% the Paths page shows. */
    completedPathsCount: number;
}
