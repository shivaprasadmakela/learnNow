import { useState, useEffect } from 'react';
import { useProfileDashboard, ProfileEditModal } from '../features/dashboard';
import { StudyConsole } from '../features/topics';
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
        editingPathId,
        profile,
        isLoading,
        theme,
        toggleTheme,
        saveProfile,
        isLoggedIn,
        signOut,
        signIn,
        signUp,
        handleLoginSuccess
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

    const slugify = (text: string) =>
        text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [selectedPathId, setSelectedPathId] = useState<number | null>(null);

    const [dashboardTab, setDashboardTab] = useState<'activities' | 'paths'>('activities');
    const [isPathsActive, setIsPathsActive] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.pathname.split('/').filter(Boolean)[0] === 'paths';
        }
        return false;
    });

    const [celebratingPath] = useState(null);

    // Resolve selectedPathId dynamically from URL whenever courses load or route changes
    useEffect(() => {
        if (typeof window === 'undefined' || courses.length === 0) return;
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0] === 'paths') {
            const pathSlug = parts[1];
            const matchedPath = courses.find(c => {
                const s = slugify(c.title);
                const normC = c.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                const normS = pathSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
                return s === pathSlug || String(c.id) === pathSlug || normC === normS || normC.includes(normS);
            });
            if (matchedPath) {
                setSelectedPathId(matchedPath.id);
            }
        }
    }, [courses]);

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
            const path = courses.find(c => c.id === selectedPathId) || courses[0];
            changeView(view, path ? slugify(path.title) : 'path');
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
        const slug = path ? slugify(path.title) : 'path';
        changeView('TOPICS', slug);
        setIsPathsActive(true);
    };

    const handleSelectRecentTopic = (topicId: number, pathId?: number) => {
        if (!isLoggedIn) {
            changeView('LOGIN');
            return;
        }
        let targetPath = pathId ? courses.find(c => c.id === pathId) : null;
        if (!targetPath) {
            targetPath = courses.find(c => c.topics?.some((t: any) => t.id === topicId)) || courses[0];
        }

        if (targetPath) {
            setSelectedPathId(targetPath.id);
            const slug = slugify(targetPath.title);
            changeView('TOPICS', slug);
            setIsPathsActive(true);
            handleSelectTopic(topicId);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner} />
                <p>Loading Profile Settings...</p>
            </div>
        );
    }

    const selectedPath = (selectedPathId ? courses.find(c => c.id === selectedPathId) : null) || courses[0];

    return (
        <div className={`${styles.appRoot} ${theme === 'dark' ? 'dark-theme' : ''}`}>
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
                {activeView !== 'LOGIN' && activeView !== 'VERIFY_EMAIL' && activeView !== 'STUDY' && (
                    <Sidebar
                        isExpanded={isExpanded}
                        activeView={activeView}
                        changeView={handleViewChange}
                        isLoggedIn={isLoggedIn}
                        isPathsActive={isPathsActive}
                        onSelectPaths={handleSelectPaths}
                        profile={profile}
                    />
                )}

                {/* Main Content View Switcher */}
                {activeView === 'STUDY' ? (
                    activeTopic ? (
                        <StudyConsole
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
                    ) : (
                        <div className={styles.loadingScreen}>
                            <div className={styles.spinner} />
                            <p>Loading Study Console...</p>
                        </div>
                    )
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
                            editingPathId={editingPathId}
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
                            onSelectRecentTopic={handleSelectRecentTopic}
                            handleViewChange={handleViewChange}
                            changeView={changeView}
                            handleLoginSuccess={handleLoginSuccess}
                            refreshUserData={refreshUserData}
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
