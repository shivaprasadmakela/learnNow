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
    recentTopics: RecentTopicActivity[];
    paths: PathProgressSummary[];
    banner: DashboardBanner;
}
