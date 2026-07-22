import { useState, useEffect } from 'react';
import { useProfileDashboard, ProfileEditModal } from '../features/dashboard';
import { TopicStudyConsole } from '../features/topics';
import { Header, Sidebar, Breadcrumb } from '../shared/components';
import { useToast } from '../shared/components/feedback/Toast';
import styles from './App.module.css';

import { useUserData } from './hooks/useUserData';
import { useTopicSession } from './hooks/useTopicSession';
import { PathCelebrationModal } from './components/PathCelebrationModal';
import { AppViewRenderer } from './components/AppViewRenderer';

export default function App() {
    const {
        activeView,
        changeView,
        profile,
        isLoading,
        error,
        theme,
        toggleTheme,
        saveProfile,
        isLoggedIn,
        signOut,
        signIn,
        signUp
    } = useProfileDashboard();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const { showToast } = useToast();

    // Custom Hooks for User Data & Topic Sessions
    const { courses, userStreak, userPoints, refreshUserData } = useUserData(isLoggedIn);
    const {
        activeTopic,
        isStudyUpdating,
        handleSelectTopic,
        handleToggleTopicComplete,
        handleToggleSubtopicComplete,
        clearTopicSession
    } = useTopicSession({
        isLoggedIn,
        courses,
        changeView,
        showToast,
        refreshUserData
    });

    const [selectedPathId, setSelectedPathId] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const parts = window.location.pathname.split('/').filter(Boolean);
            if (parts.length >= 2 && parts[0] === 'paths' && parts[1] === 'java-backend-path') {
                return 1;
            }
        }
        return null;
    });

    const [dashboardTab, setDashboardTab] = useState<'activities' | 'paths'>('activities');
    const [isPathsActive, setIsPathsActive] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.pathname.split('/').filter(Boolean)[0] === 'paths';
        }
        return false;
    });

    const [celebratingPath] = useState(null);

    // Auth redirection effect
    useEffect(() => {
        if (!isLoading) {
            if (isLoggedIn && (activeView === 'HOME' || activeView === 'LOGIN')) {
                changeView('DASHBOARD');
            } else if (!isLoggedIn && (activeView === 'DASHBOARD' || activeView === 'STUDY')) {
                changeView('LOGIN');
            }
        }
    }, [isLoggedIn, activeView, isLoading, changeView]);

    const handleViewChange = (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => {
        if (view === 'TOPICS') {
            changeView(view, 'java-backend-path');
        } else {
            changeView(view);
        }
        setIsPathsActive(view === 'PATHS' || view === 'TOPICS');
        if (view !== 'TOPICS') setSelectedPathId(null);
        if (view === 'DASHBOARD') setDashboardTab('activities');
    };

    const handleSelectPaths = () => {
        setIsPathsActive(true);
        setSelectedPathId(null);
        changeView('PATHS');
    };

    const handleSelectPath = (pathId: number) => {
        if (!isLoggedIn) {
            changeView('LOGIN');
            return;
        }
        setSelectedPathId(pathId);
        const path = courses.find(c => c.id === pathId);
        const slug = path?.title.toLowerCase().includes('java') ? 'java-backend-path' : undefined;
        changeView('TOPICS', slug);
        setIsPathsActive(true);
    };

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner} />
                <p>Loading Profile Settings...</p>
            </div>
        );
    }

    const selectedPath = courses.find(c => c.id === selectedPathId) || courses[0];

    return (
        <div className={`${styles.appRoot} ${theme === 'dark' ? 'dark-theme' : ''}`}>
            {error && (
                <div className={styles.errorBanner}>
                    <p>⚠️ {error}. Please ensure the Spring Boot server is running on port 8080.</p>
                </div>
            )}

            {/* Global Sticky Top Header */}
            {activeView !== 'STUDY' && (
                <Header
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    changeView={handleViewChange}
                    profile={profile}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    isLoggedIn={isLoggedIn}
                    signOut={signOut}
                    onOpenSettings={() => setIsEditingProfile(true)}
                    points={userPoints}
                    streak={userStreak}
                />
            )}

            <div className={activeView === 'STUDY' ? styles.appLayoutStudy : styles.appLayout}>
                {/* Sidebar */}
                {activeView !== 'LOGIN' && activeView !== 'STUDY' && (
                    <Sidebar
                        isExpanded={isExpanded}
                        activeView={activeView}
                        changeView={handleViewChange}
                        isLoggedIn={isLoggedIn}
                        isPathsActive={isPathsActive}
                        onSelectPaths={handleSelectPaths}
                    />
                )}

                {/* Main Content View Switcher */}
                {activeView === 'STUDY' ? (
                    activeTopic ? (
                        <TopicStudyConsole
                            topic={activeTopic}
                            onClose={() => {
                                clearTopicSession();
                                changeView('TOPICS', 'java-backend-path');
                                refreshUserData();
                            }}
                            onToggleComplete={handleToggleTopicComplete}
                            onToggleSubtopicComplete={handleToggleSubtopicComplete}
                            isUpdating={isStudyUpdating}
                        />
                    ) : null
                ) : (
                    <main className={styles.mainContent}>
                        {(activeView === 'PATHS' || activeView === 'TOPICS') && (
                            <Breadcrumb
                                crumbs={[
                                    { onClick: () => handleViewChange(isLoggedIn ? 'DASHBOARD' : 'HOME') },
                                    ...(activeView === 'TOPICS'
                                        ? [
                                            { label: 'Paths', onClick: handleSelectPaths },
                                            { label: selectedPath?.title || 'Java Backend Developer Path' },
                                        ]
                                        : [{ label: 'Paths' }]
                                    ),
                                ]}
                            />
                        )}

                        <AppViewRenderer
                            activeView={activeView}
                            isLoggedIn={isLoggedIn}
                            profile={profile}
                            courses={courses}
                            selectedPath={selectedPath}
                            dashboardTab={dashboardTab}
                            setDashboardTab={setDashboardTab}
                            signIn={signIn}
                            signUp={signUp}
                            handleSelectPath={handleSelectPath}
                            handleSelectTopic={handleSelectTopic}
                            handleViewChange={handleViewChange}
                            changeView={changeView}
                        />
                    </main>
                )}
            </div>

            {/* Modals & Celebration */}
            {isEditingProfile && profile && (
                <ProfileEditModal
                    profile={profile}
                    onClose={() => setIsEditingProfile(false)}
                    onSaveProfile={saveProfile}
                />
            )}

            <PathCelebrationModal
                path={celebratingPath}
                onClose={() => {}}
            />
        </div>
    );
}
