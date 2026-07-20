export interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
    bio: string;
}

export interface WeeklyCalendarDay {
    name: string;
    date: string;
    completed: boolean;
    isDotted: boolean;
}

export interface ActivityFeedItem {
    id: string;
    eventType: string;
    pointsAwarded: number;
    occurredAt: string;
    pathTitle?: string;
    topicTitle?: string;
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

export interface DashboardBanner {
    type: 'FEATURED' | 'REVIEW';
    pathId?: number;
    pathTitle: string;
    pathDescription: string;
    pathCategory: string;
}

export interface DashboardResponse {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    timezone: string;
    weeklyCalendar: WeeklyCalendarDay[];
    activities: ActivityFeedItem[];
    paths: PathProgressSummary[];
    banner: DashboardBanner;
}
