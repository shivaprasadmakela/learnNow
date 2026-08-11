import React, { useEffect } from 'react';
import type { UserProfile } from '../../../types';
import { useDashboard } from '../hooks/useDashboard';
import { Loader } from '../../../shared/components/ui/Loader';
import styles from '../styles/Dashboard.module.css';
import { DashboardHeader, WelcomeGreeting } from '../components/DashboardHeader';
import { DashboardTabs } from '../components/DashboardTabs';
import { RecentTopicsList } from '../components/RecentTopicsList';
import { PathsOverview } from '../components/PathsOverview';
import { BookmarkedTopicsList } from '../components/BookmarkedTopicsList';
import { StreakCalendar } from '../components/StreakCalendar';
import { WeeklyLeagueBoard } from '../components/WeeklyLeagueBoard';
import { OverallProgress } from '../components/OverallProgress';
import { BrandFooter } from '../components/BrandFooter';

import type { Course } from '../../../types';

export interface DashboardProps {
    profile: UserProfile | null;
    courses?: Course[];
    isCoursesLoading?: boolean;
    refreshUserData?: (force?: boolean) => void;
    activeTab?: 'activities' | 'paths' | 'bookmarks';
    setActiveTab?: (tab: 'activities' | 'paths' | 'bookmarks') => void;
    onSelectPath: (pathId: number) => void;
    onSelectRecentTopic?: (topicId: number, pathId?: number) => void;
    onMetricsLoaded?: (streak: number, points: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    profile,
    courses = [],
    isCoursesLoading = false,
    refreshUserData,
    activeTab = 'activities',
    setActiveTab,
    onSelectPath,
    onSelectRecentTopic,
    onMetricsLoaded
}) => {
    const { dashboardData, isLoading, error } = useDashboard();
    const hasReportedRef = React.useRef(false);

    useEffect(() => {
        if (dashboardData && onMetricsLoaded && !hasReportedRef.current) {
            hasReportedRef.current = true;
            onMetricsLoaded(dashboardData.currentStreak, dashboardData.totalPoints);
        }
    }, [dashboardData, onMetricsLoaded]);

    useEffect(() => {
        if (activeTab === 'paths' && courses.length === 0 && !isCoursesLoading && refreshUserData) {
            refreshUserData(true);
        }
    }, [activeTab, courses.length, isCoursesLoading, refreshUserData]);

    if (isLoading) {
        return <Loader variant="inline" text="Loading your dashboard metrics..." showColdStartFunnyMessages={true} />;
    }

    if (error || !dashboardData) {
        return (
            <div className={styles.container} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className={styles.errorContainer}>
                    <p style={{ color: 'var(--tech-red)' }}>⚠️ {error || 'Failed to load progress data.'}</p>
                </div>
            </div>
        );
    }

    const {
        currentStreak,
        weeklyCalendar,
        recentTopics = [],
        banner,
        weeklyLeaderboard = []
    } = dashboardData;

    return (
        <div className={styles.container}>
            <WelcomeGreeting profile={profile} />

            {/* Main Dashboard Grid */}
            <div className={styles.dashboardGrid}>
                {/* Left Column: Course Banner Card, Tabs & Content */}
                <div className={styles.leftCol}>
                    <DashboardHeader
                        profile={profile}
                        banner={banner}
                        courses={courses}
                        onSelectPath={onSelectPath}
                    />

                    <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                    <div className={styles.tabContent}>
                        {activeTab === 'activities' && (
                            <RecentTopicsList
                                topics={recentTopics}
                                onSelectTopic={(topicId, pathId) => {
                                    if (onSelectRecentTopic) {
                                        onSelectRecentTopic(topicId, pathId);
                                    } else if (pathId) {
                                        onSelectPath(pathId);
                                    }
                                }}
                            />
                        )}
                        {activeTab === 'paths' && (
                            <PathsOverview
                                courses={courses}
                                isLoading={isCoursesLoading}
                                onSelectPath={onSelectPath}
                            />
                        )}
                        {activeTab === 'bookmarks' && (
                            <BookmarkedTopicsList
                                courses={courses}
                                onSelectRecentTopic={onSelectRecentTopic}
                                onSelectPath={onSelectPath}
                            />
                        )}
                    </div>
                </div>

                {/* Right Column: Streak, League & Progress Table */}
                <div className={styles.rightCol}>
                    <StreakCalendar
                        currentStreak={currentStreak}
                        weeklyCalendar={weeklyCalendar}
                    />
                    <WeeklyLeagueBoard entries={weeklyLeaderboard} />
                    <OverallProgress
                        courses={courses}
                        streak={currentStreak}
                        points={dashboardData.totalPoints}
                    />
                </div>
            </div>

            <BrandFooter />
        </div>
    );
};

export default Dashboard;
