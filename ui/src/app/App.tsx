import React, { useState, useEffect, Suspense } from 'react';
import { useProfileDashboard } from '../features/dashboard/hooks/useProfileDashboard';
import { Header, Sidebar, Breadcrumb, Loader } from '../shared/components';
import { useToast } from '../shared/components/feedback/Toast';
import styles from './App.module.css';

import { useUserData } from './hooks/useUserData';
import { useTopicSession } from './hooks/useTopicSession';
import { AppViewRenderer } from './components/AppViewRenderer';

const ProfileEditModal = React.lazy(() => import('../features/dashboard/components/ProfileEditModal/ProfileEditModal').then(m => ({ default: m.ProfileEditModal })));
const StudyConsole = React.lazy(() => import('../features/topics/components/StudyConsole/StudyConsole').then(m => ({ default: m.StudyConsole })));
const PathCelebrationModal = React.lazy(() => import('./components/PathCelebrationModal').then(m => ({ default: m.PathCelebrationModal })));
const BuyMeACoffeeModal = React.lazy(() => import('../features/donation/components/BuyMeACoffeeModal').then(m => ({ default: m.BuyMeACoffeeModal })));

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
        signInWithGoogle,
        handleLoginSuccess
    } = useProfileDashboard();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const { showToast } = useToast();

    // Custom Hooks for User Data & Topic Sessions
    const {
        courses,
        isCoursesLoading,
        hasMorePaths,
        isLoadingMorePaths,
        loadMorePaths,
        userStreak,
        userPoints,
        updateMetrics,
        refreshUserData,
        loadTopicsForPath,
        loadMoreTopicsForPath,
        getTopicPaging,
        markPathsStale
    } = useUserData(isLoggedIn, activeView, isLoading);
    const {
        activeTopic,
        isStudyLoading,
        isStudyUpdating,
        handleSelectTopic,
        handleSelectNextTopic,
        handleToggleTopicComplete,
        handleToggleSubtopicComplete,
        clearTopicSession
    } = useTopicSession({
        isLoggedIn,
        courses,
        changeView,
        showToast,
        markPathsStale
    });

    const slugify = (text: string) =>
        text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [selectedPathId, setSelectedPathId] = useState<number | null>(null);

    const [dashboardTab, setDashboardTab] = useState<'activities' | 'paths' | 'bookmarks'>('activities');
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

    // On-demand topic fetching when a path is selected
    useEffect(() => {
        if (selectedPathId) {
            const target = courses.find(c => String(c.id) === String(selectedPathId));
            if (target && (!target.topics || target.topics.length === 0)) {
                loadTopicsForPath(selectedPathId);
            }
        }
    }, [selectedPathId, courses, loadTopicsForPath]);

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

    /**
     * Keeps "next topic" reachable from the study console.
     *
     * Topics are paginated, so the last topic the client has loaded is not necessarily the last
     * topic on the path. Without this, finishing topic ten of thirty would look like the end of
     * the course. Reaching the edge of what is loaded pulls the following page in the background.
     */
    useEffect(() => {
        if (activeView !== 'STUDY' || !activeTopic) return;
        const course = courses.find(c => c.topics?.some(t => String(t.id) === String(activeTopic.id)));
        if (!course?.id) return;
        const loadedTopics = course.topics || [];
        if (loadedTopics.length === 0) return;
        if (String(loadedTopics[loadedTopics.length - 1].id) !== String(activeTopic.id)) return;

        const paging = getTopicPaging(course.id);
        if (paging.hasNext && !paging.isLoading) {
            loadMoreTopicsForPath(course.id);
        }
    }, [activeView, activeTopic, courses, getTopicPaging, loadMoreTopicsForPath]);

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
        loadTopicsForPath(pathId);
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
        return <Loader variant="fullScreen" showColdStartFunnyMessages={true} />;
    }

    const rawSelectedPath = (selectedPathId ? courses.find(c => c.id === selectedPathId) : null) || courses[0];
    const selectedPathTopics = rawSelectedPath?.topics || [];
    const computedPathProgress = selectedPathTopics.length > 0
        ? Math.round(selectedPathTopics.reduce((acc: number, t: any) => acc + (t.isCompleted ? 100 : (t.progressPercentage || 0)), 0) / selectedPathTopics.length)
        : (rawSelectedPath?.progressPercentage || 0);

    const selectedPath = rawSelectedPath ? {
        ...rawSelectedPath,
        progressPercentage: computedPathProgress
    } : courses[0];

    // Topic paging follows whichever path the Topics view is showing, which is not always the one
    // explicitly selected - on a cold load from a bookmarked URL it falls back to the first path.
    const selectedPathTopicPaging = getTopicPaging(rawSelectedPath?.id);
    const handleLoadMoreTopics = () => {
        if (rawSelectedPath?.id) loadMoreTopicsForPath(rawSelectedPath.id);
    };

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
                    points={userPoints ?? profile?.gemsCount ?? profile?.points ?? 0}
                    streak={userStreak ?? profile?.streakCount ?? 0}
                />
            )}

            <div className={activeView === 'STUDY' ? styles.appLayoutStudy : styles.appLayout}>
                {/* Mobile Backdrop */}
                {isExpanded && activeView !== 'STUDY' && (
                    <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
                )}

                {/* Sidebar */}
                {activeView !== 'LOGIN' && activeView !== 'VERIFY_EMAIL' && activeView !== 'STUDY' && (
                    <Sidebar
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                        activeView={activeView}
                        changeView={handleViewChange}
                        isLoggedIn={isLoggedIn}
                        isPathsActive={isPathsActive}
                        onSelectPaths={handleSelectPaths}
                        profile={profile}
                        onOpenDonationModal={() => setIsDonationModalOpen(true)}
                    />
                )}

                {/* Main Content View Switcher */}
                {activeView === 'STUDY' ? (
                    activeTopic && !isStudyLoading ? (
                        <Suspense fallback={null}>
                            <StudyConsole
                                topic={activeTopic}
                                onClose={() => {
                                    clearTopicSession();
                                    changeView('TOPICS', 'java-backend-path');
                                    refreshUserData();
                                }}
                                onToggleComplete={handleToggleTopicComplete}
                                onToggleSubtopicComplete={handleToggleSubtopicComplete}
                                onSelectNextTopic={handleSelectNextTopic}
                                nextTopicTitle={(() => {
                                    if (!activeTopic || !courses) return undefined;
                                    for (const course of courses) {
                                        if (course.topics && course.topics.length > 0) {
                                            const idx = course.topics.findIndex(t => String(t.id) === String(activeTopic.id));
                                            if (idx >= 0 && idx < course.topics.length - 1) {
                                                return course.topics[idx + 1].title;
                                            }
                                        }
                                    }
                                    return undefined;
                                })()}
                                onOpenFullCompiler={(code, lang) => {
                                    const langId = lang.toLowerCase() === 'javascript' ? 'js' : lang.toLowerCase();
                                    localStorage.setItem(`compiler_draft_${langId}`, code);
                                    changeView('COMPILER');
                                }}
                                isUpdating={isStudyUpdating}
                            />
                        </Suspense>
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
                            isCoursesLoading={isCoursesLoading}
                            hasMorePaths={hasMorePaths}
                            isLoadingMorePaths={isLoadingMorePaths}
                            onLoadMorePaths={loadMorePaths}
                            hasMoreTopics={selectedPathTopicPaging.hasNext}
                            isLoadingMoreTopics={selectedPathTopicPaging.isLoading}
                            onLoadMoreTopics={handleLoadMoreTopics}
                            selectedPath={selectedPath}
                            dashboardTab={dashboardTab}
                            setDashboardTab={setDashboardTab}
                            signIn={signIn}
                            signUp={signUp}
                            signInWithGoogle={signInWithGoogle}
                            handleSelectPath={handleSelectPath}
                            handleSelectTopic={handleSelectTopic}
                            onSelectRecentTopic={handleSelectRecentTopic}
                            handleViewChange={handleViewChange}
                            changeView={changeView}
                            handleLoginSuccess={handleLoginSuccess}
                            refreshUserData={refreshUserData}
                            onMetricsLoaded={updateMetrics}
                        />
                    </main>
                )}
            </div>

            {/* Modals & Celebration */}
            {isEditingProfile && profile && (
                <Suspense fallback={null}>
                    <ProfileEditModal
                        profile={profile}
                        onClose={() => setIsEditingProfile(false)}
                        onSaveProfile={saveProfile}
                    />
                </Suspense>
            )}

            <Suspense fallback={null}>
                <PathCelebrationModal
                    path={celebratingPath}
                    onClose={() => {}}
                />

                <BuyMeACoffeeModal
                    isOpen={isDonationModalOpen}
                    onClose={() => setIsDonationModalOpen(false)}
                    currentUser={profile ? { name: profile.fullName, email: (profile as any).email } : null}
                />
            </Suspense>
        </div>
    );
}
