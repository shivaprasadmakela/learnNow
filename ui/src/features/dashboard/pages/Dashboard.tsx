import React, { useEffect } from 'react';
import type { NextLesson, TopicRef, UserProfile } from '../../../types';
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
import { DsaProgressTile } from '../components/DsaProgressTile';

import type { Course } from '../../../types';

export interface DashboardProps {
    profile: UserProfile | null;
    courses?: Course[];
    isCoursesLoading?: boolean;
    refreshUserData?: (force?: boolean) => void;
    activeTab?: 'activities' | 'paths' | 'bookmarks';
    setActiveTab?: (tab: 'activities' | 'paths' | 'bookmarks') => void;
    onSelectPath: (pathId: number) => void;
    /** Opens a lesson directly - the next-step card's button. */
    onOpenLesson: (lesson: NextLesson) => void;
    onSelectRecentTopic?: (topic: TopicRef) => void;
    /** Opens the full Paths page from the five-path preview. */
    onViewAllPaths?: () => void;
    onOpenDsaSheet?: () => void;
    onOpenDsaProblem?: (stepSlug: string, problemSlug: string) => void;
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
    onOpenLesson,
    onSelectRecentTopic,
    onViewAllPaths,
    onOpenDsaSheet,
    onOpenDsaProblem,
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

    /**
     * Fetch paths once when the Paths tab is first opened.
     *
     * The guard is a ref, not the effect's own dependencies. The previous version keyed off
     * courses.length === 0 && !isCoursesLoading and passed force: true, which bypasses every
     * guard inside refreshUserData. When the request failed -- or simply returned no paths --
     * courses.length stayed at 0 while isCoursesLoading flipped back to false, so the
     * dependencies changed, the effect re-ran, and it fetched again without end. Its own
     * loading state was the thing re-triggering it.
     *
     * Keyed on activeTab so switching away and back re-attempts, which is the one case where a
     * retry is actually wanted.
     */
    const pathsFetchAttemptedFor = React.useRef<string | null>(null);

    useEffect(() => {
        if (activeTab !== 'paths' || !refreshUserData) {
            return;
        }
        if (pathsFetchAttemptedFor.current === activeTab) {
            return;
        }
        if (courses.length > 0 || isCoursesLoading) {
            return;
        }
        pathsFetchAttemptedFor.current = activeTab;
        refreshUserData(true);
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
                    <DashboardHeader banner={banner} onOpenLesson={onOpenLesson} />

                    <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                    <div className={styles.tabContent}>
                        {activeTab === 'activities' && (
                            <RecentTopicsList
                                topics={recentTopics}
                                onSelectTopic={topic => onSelectRecentTopic?.(topic)}
                            />
                        )}
                        {activeTab === 'paths' && (
                            <PathsOverview
                                courses={courses}
                                isLoading={isCoursesLoading}
                                onSelectPath={onSelectPath}
                                onViewAll={onViewAllPaths}
                            />
                        )}
                        {activeTab === 'bookmarks' && (
                            <BookmarkedTopicsList
                                onSelectRecentTopic={onSelectRecentTopic}
                                onSelectDsaProblem={onOpenDsaProblem}
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
                    {onOpenDsaSheet && onOpenDsaProblem && (
                        <DsaProgressTile
                            onOpenSheet={onOpenDsaSheet}
                            onOpenProblem={onOpenDsaProblem}
                        />
                    )}
                    <OverallProgress
                        streak={currentStreak}
                        points={dashboardData.totalPoints}
                        publishedPaths={dashboardData.publishedPathsCount}
                        completedPaths={dashboardData.completedPathsCount}
                    />
                </div>
            </div>

            <BrandFooter />
        </div>
    );
};

export default Dashboard;
