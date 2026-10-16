import React, { useState, useEffect, Suspense } from 'react';
import { useProfileDashboard, type ViewState } from '../features/dashboard/hooks/useProfileDashboard';
import { Header, Sidebar, Breadcrumb, Loader } from '../shared/components';
import { useToast } from '../shared/components/feedback/Toast';
import styles from './App.module.css';

import { useUserData } from './hooks/useUserData';
import { useTopicSession } from './hooks/useTopicSession';
import { AppViewRenderer } from './components/AppViewRenderer';
import type { NextLesson } from '../features/tracks/api/tracks.api';

const StudyConsole = React.lazy(() => import('../features/topics/components/StudyConsole/StudyConsole').then(m => ({ default: m.StudyConsole })));
const PathCelebrationModal = React.lazy(() => import('./components/PathCelebrationModal').then(m => ({ default: m.PathCelebrationModal })));
const BuyMeACoffeeModal = React.lazy(() => import('../features/donation/components/BuyMeACoffeeModal').then(m => ({ default: m.BuyMeACoffeeModal })));
const DsaProblemPage = React.lazy(() => import('../features/dsa').then(m => ({ default: m.DsaProblemPage })));

export default function App() {
    const {
        activeView,
        changeView,
        editingPathId,
        dsaRoute,
        trackSlug,
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
        markPathsStale,
        resolveTopicIdBySlug
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
        markPathsStale,
        resolveTopicIdBySlug
    });

    const slugify = (text: string) =>
        text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [selectedPathId, setSelectedPathId] = useState<number | null>(null);

    const [dashboardTab, setDashboardTab] = useState<'activities' | 'paths' | 'bookmarks'>('activities');
    const [isPathsActive, setIsPathsActive] = useState(() => {
        if (typeof window !== 'undefined') {
            const first = window.location.pathname.split('/').filter(Boolean)[0];
            return first === 'paths' || first === 'tracks';
        }
        return false;
    });

    const [celebratingPath] = useState(null);

    /** The open track's title, for the breadcrumb; the page reports it once loaded. */
    const [trackTitle, setTrackTitle] = useState<string | null>(null);

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

    const handleViewChange = (view: ViewState) => {
        if (view === 'TOPICS') {
            const path = courses.find(c => c.id === selectedPathId) || courses[0];
            changeView(view, path ? slugify(path.title) : 'path');
        } else {
            changeView(view);
        }
        setIsPathsActive(view === 'PATHS' || view === 'TOPICS' || view === 'TRACK');
        if (view !== 'TOPICS') setSelectedPathId(null);
        if (view === 'DASHBOARD') setDashboardTab('activities');
    };

    /**
     * After the account is gone there is no session to return to, so this ends it the same way
     * signing out does and sends them to the landing page. Routing to the dashboard instead would
     * fire a profile fetch against a user the server has just deleted.
     */
    const handleAccountErased = () => {
        showToast('Your account and all of its data have been deleted.', 'success');
        signOut();
        changeView('HOME');
    };

    /**
     * The reset revoked every session server-side, this tab's included. Ending it here, rather
     * than waiting for the next request to bounce, sends the learner straight to a working sign-in.
     */
    const handlePasswordReset = async () => {
        // signOut lands on HOME when it finishes, so it has to finish before LOGIN is chosen.
        if (isLoggedIn) await signOut();
        changeView('LOGIN');
    };

    const isDsaView =
        activeView === 'DSA' || activeView === 'DSA_PROBLEM';

    const handleSelectDsa = () => {
        setIsPathsActive(false);
        changeView('DSA');
    };

    const handleOpenDsaProblem = (stepSlug: string, problemSlug: string) => {
        changeView('DSA_PROBLEM', stepSlug, problemSlug);
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

    const handleSelectTrack = (slug: string) => {
        setTrackTitle(null);
        setIsPathsActive(true);
        changeView('TRACK', slug);
    };

    /** A step on a track's roadmap opens its path, which may not be the one selected before. */
    const handleOpenPathFromTrack = (pathId: string, pathTitle: string) => {
        if (!isLoggedIn) {
            changeView('LOGIN');
            return;
        }
        const course = courses.find(c => String(c.id) === pathId);
        if (course) {
            setSelectedPathId(course.id);
            loadTopicsForPath(course.id);
        }
        setIsPathsActive(true);
        changeView('TOPICS', slugify(pathTitle));
    };

    /**
     * Opens the lesson a track says comes next. The study console picks its lesson from the URL,
     * so the full path/topic/lesson URL is written first and the topic loaded without rewriting
     * it - otherwise a topic from a path whose topics are not loaded yet would get a generic URL.
     */
    const handleContinueTrack = (lesson: NextLesson) => {
        changeView(
            'STUDY',
            slugify(lesson.pathTitle),
            `${slugify(lesson.topicTitle)}/${slugify(lesson.subtopicTitle)}`
        );
        handleSelectTopic(lesson.topicId, lesson.subtopicId, lesson.subtopicTitle, true);
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
                {activeView !== 'LOGIN' && activeView !== 'VERIFY_EMAIL' && activeView !== 'RESET_PASSWORD' && activeView !== 'STUDY' && (
                    <Sidebar
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                        activeView={activeView}
                        changeView={handleViewChange}
                        isLoggedIn={isLoggedIn}
                        isPathsActive={isPathsActive}
                        onSelectPaths={handleSelectPaths}
                        isDsaActive={isDsaView}
                        onSelectDsa={handleSelectDsa}
                        profile={profile}
                        onOpenDonationModal={() => setIsDonationModalOpen(true)}
                    />
                )}

                {/* Main Content View Switcher */}
                {activeView === 'DSA_PROBLEM' ? (
                    <main className={styles.mainContentFlush}>
                    <Suspense fallback={null}>
                        <DsaProblemPage
                            problemSlug={dsaRoute.problemSlug || ''}
                            isLoggedIn={isLoggedIn}
                            onBackToSheet={() => changeView('DSA')}
                            onNavigateProblem={handleOpenDsaProblem}
                            onRequireLogin={() => changeView('LOGIN')}
                            onOpenFullCompiler={(code, lang) => {
                                const langId = lang.toLowerCase() === 'javascript' ? 'js' : lang.toLowerCase();
                                localStorage.setItem(`compiler_draft_${langId}`, code);
                                changeView('COMPILER');
                            }}
                        />
                    </Suspense>
                    </main>
                ) : activeView === 'STUDY' ? (
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
                        {(activeView === 'PATHS' || activeView === 'TOPICS' || activeView === 'TRACK') && (
                            <Breadcrumb
                                crumbs={[
                                    { onClick: () => handleViewChange(isLoggedIn ? 'DASHBOARD' : 'HOME') },
                                    ...(activeView === 'TOPICS'
                                        ? [
                                            { label: 'Paths', onClick: handleSelectPaths },
                                            { label: selectedPath?.title || 'Java Backend Developer Path' },
                                        ]
                                        : activeView === 'TRACK'
                                            ? [
                                                { label: 'Paths', onClick: handleSelectPaths },
                                                { label: trackTitle || 'Career track' },
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
                            trackSlug={trackSlug}
                            onSelectTrack={handleSelectTrack}
                            onOpenPathFromTrack={handleOpenPathFromTrack}
                            onContinueTrack={handleContinueTrack}
                            onTrackTitleLoaded={setTrackTitle}
                            onSelectPaths={handleSelectPaths}
                            onOpenDsaProblem={handleOpenDsaProblem}
                            handleSelectTopic={handleSelectTopic}
                            onSelectRecentTopic={handleSelectRecentTopic}
                            handleViewChange={handleViewChange}
                            changeView={changeView}
                            handleLoginSuccess={handleLoginSuccess}
                            refreshUserData={refreshUserData}
                            onMetricsLoaded={updateMetrics}
                            onSaveProfile={saveProfile}
                            onAccountErased={handleAccountErased}
                            onPasswordReset={handlePasswordReset}
                        />
                    </main>
                )}
            </div>

            {/* Modals & Celebration */}
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
