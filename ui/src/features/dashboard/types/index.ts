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

export interface TopicProgressSummary {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    completed: boolean;
    progressPercentage: number;
}

export interface PathProgressSummary {
    id: number;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    progressPercentage: number;
    completedTopicsCount: number;
    totalTopicsCount: number;
    topics: TopicProgressSummary[];
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

export interface WeeklyLeaderboardEntry {
    userId: string;
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
    paths: PathProgressSummary[];
    banner: DashboardBanner;
    weeklyLeaderboard?: WeeklyLeaderboardEntry[];
    currentUserRank?: number;
    currentUserWeeklyPoints?: number;
}
