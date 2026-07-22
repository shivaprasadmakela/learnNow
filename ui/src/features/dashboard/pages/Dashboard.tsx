import React, { useEffect } from 'react';
import type { UserProfile } from '../../../types';
import { useDashboard } from '../hooks/useDashboard';
import styles from '../styles/Dashboard.module.css';
import { DashboardHeader, WelcomeGreeting } from '../components/DashboardHeader';
import { DashboardTabs } from '../components/DashboardTabs';
import { RecentTopicsList } from '../components/RecentTopicsList';
import { PathsOverview } from '../components/PathsOverview';
import { StreakCalendar } from '../components/StreakCalendar';
import { WeeklyLeagueBoard } from '../components/WeeklyLeagueBoard';
import { OverallProgress } from '../components/OverallProgress';

export interface DashboardProps {
    profile: UserProfile | null;
    activeTab?: 'activities' | 'paths';
    setActiveTab?: (tab: 'activities' | 'paths') => void;
    onSelectPath: (pathId: number) => void;
    onMetricsLoaded?: (streak: number, points: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    profile,
    activeTab = 'activities',
    setActiveTab,
    onSelectPath,
    onMetricsLoaded
}) => {
    const { dashboardData, isLoading, error } = useDashboard();

    useEffect(() => {
        if (dashboardData && onMetricsLoaded) {
            onMetricsLoaded(dashboardData.currentStreak, dashboardData.totalPoints);
        }
    }, [dashboardData, onMetricsLoaded]);

    if (isLoading) {
        return (
            <div className={styles.container} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className={styles.loadingSkeleton}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard metrics...</p>
                </div>
            </div>
        );
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
        paths = [],
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
                        paths={paths}
                        onSelectPath={onSelectPath}
                    />

                    <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                    <div className={styles.tabContent}>
                        {activeTab === 'activities' ? (
                            <RecentTopicsList topics={recentTopics} onSelectTopic={onSelectPath} />
                        ) : (
                            <PathsOverview paths={paths} onSelectPath={onSelectPath} />
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
                    <OverallProgress paths={paths} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
