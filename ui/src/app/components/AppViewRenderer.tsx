import React from 'react';
import { Home } from '../../features/home';
import { Dashboard } from '../../features/dashboard';
import { LoginPage } from '../../features/auth';
import { PathsPage } from '../../features/paths';
import { TopicsPage } from '../../features/topics';
import styles from '../App.module.css';
import type { Course, UserProfile } from '../../types';

interface AppViewRendererProps {
    activeView: string;
    isLoggedIn: boolean;
    profile: UserProfile | null;
    courses: Course[];
    selectedPath: Course;
    dashboardTab: 'activities' | 'paths';
    setDashboardTab: (tab: 'activities' | 'paths') => void;
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (firstName: string, lastName: string, email: string, pass: string) => Promise<unknown>;
    handleSelectPath: (pathId: number) => void;
    handleSelectTopic: (topicId: number) => void;
    handleViewChange: (view: any) => void;
    changeView: (view: any) => void;
}

export const AppViewRenderer: React.FC<AppViewRendererProps> = ({
    activeView,
    isLoggedIn,
    profile,
    courses,
    selectedPath,
    dashboardTab,
    setDashboardTab,
    signIn,
    signUp,
    handleSelectPath,
    handleSelectTopic,
    handleViewChange,
    changeView
}) => {
    return (
        <div className={
            activeView === 'HOME' || activeView === 'LOGIN'
                ? styles.pageContentFull
                : activeView === 'DASHBOARD'
                    ? styles.pageContentDashboard
                    : styles.pageContent
        }>
            {activeView === 'HOME' && (
                <Home
                    courses={courses}
                    onSelectCourse={() => {
                        if (isLoggedIn) {
                            changeView('DASHBOARD');
                            setDashboardTab('paths');
                        } else {
                            changeView('LOGIN');
                        }
                    }}
                    searchQuery=""
                    setSearchQuery={() => {}}
                    isLoggedIn={isLoggedIn}
                    changeView={handleViewChange}
                />
            )}

            {activeView === 'DASHBOARD' && (
                <Dashboard
                    profile={profile}
                    onSelectPath={handleSelectPath}
                    activeTab={dashboardTab}
                    setActiveTab={setDashboardTab}
                />
            )}

            {activeView === 'LOGIN' && (
                <LoginPage
                    signIn={signIn}
                    signUp={signUp}
                    changeView={changeView}
                />
            )}

            {activeView === 'PATHS' && (
                <PathsPage
                    courses={courses}
                    onSelectPath={handleSelectPath}
                    isLoggedIn={isLoggedIn}
                />
            )}

            {activeView === 'TOPICS' && (
                <TopicsPage
                    pathTitle={selectedPath?.title || 'Java Backend Developer Path'}
                    managedBy={selectedPath?.managedBy || 'learnNow'}
                    topics={selectedPath?.topics || []}
                    progressPercent={selectedPath?.progressPercentage || 0}
                    onSelectTopic={handleSelectTopic}
                />
            )}
        </div>
    );
};

export default AppViewRenderer;
