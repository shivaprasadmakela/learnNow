import { useState, useEffect, useCallback } from 'react';
import { Dashboard, useProfileDashboard, ProfileEditModal, fetchDashboard } from '../features/dashboard';
import { PathsPage } from '../features/paths';
import { fetchPaths, fetchPublicPaths, fetchTopicDetails } from '../shared/api';
import type { TopicDetails } from '../shared/api';

import { Home } from '../features/home';
import { PathRoadmapPage, TopicStudyConsole } from '../features/roadmap';
import { LoginPage, VerifyEmailPage } from '../features/auth';
import { Header, Sidebar, Breadcrumb } from '../shared/components';
import { useToast } from '../shared/components/feedback/Toast';
import { useRecordActivity } from '../features/activity';
import styles from './App.module.css';
import type { Course } from '../types';
import { Trophy, Sparkles, X } from 'lucide-react';

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

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

        // Auth properties
        isLoggedIn,
        signOut,
        signUp,
        signIn,
        handleLoginSuccess
    } = useProfileDashboard();

    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const { showToast } = useToast();
    const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
    const [activeTopic, setActiveTopic] = useState<TopicDetails | null>(null);
    const [isStudyLoading, setIsStudyLoading] = useState(false);
    const [isStudyUpdating, setIsStudyUpdating] = useState(false);

    // Gamification metrics
    const [userStreak, setUserStreak] = useState<number>(0);
    const [userPoints, setUserPoints] = useState<number>(0);

    // Celebration modal state
    const [celebratingPath, setCelebratingPath] = useState<Course | null>(null);

    const { recordTopicCompletion, recordSubtopicCompletion } = useRecordActivity();

    // Centralized user progress & metrics refresh
    const refreshUserData = useCallback(async () => {
        try {
            if (isLoggedIn) {
                const [fetchedPaths, dashboardData] = await Promise.all([
                    fetchPaths(),
                    fetchDashboard()
                ]);

                if (fetchedPaths) {
                    const mapped: Course[] = fetchedPaths.map(p => {
                        const summary = dashboardData?.paths?.find(dp => dp.id === p.id);
                        return {
                            id: p.id,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            duration: '10 hours',
                            level: 'Intermediate',
                            imageUrl: 'https://placeholder.co/ml',
                            managedBy: p.managedBy,
                            progressPercentage: summary ? summary.progressPercentage : 0,
                            topics: summary && summary.topics && summary.topics.length > 0
                                ? summary.topics.map(t => ({
                                    id: t.id,
                                    title: t.title,
                                    description: t.description,
                                    category: t.category,
                                    duration: t.duration,
                                    isCompleted: t.completed,
                                    progressPercentage: t.progressPercentage
                                }))
                                : p.topics
                        };
                    });
                    setCourses(mapped);
                }

                if (dashboardData) {
                    setUserStreak(dashboardData.currentStreak);
                    setUserPoints(dashboardData.totalPoints);
                }
            } else {
                const publicPaths = await fetchPublicPaths();
                if (publicPaths) {
                    const mapped: Course[] = publicPaths.map(p => ({
                        id: p.id,
                        title: p.title,
                        description: p.description,
                        category: p.category,
                        duration: '10 hours',
                        level: 'Intermediate',
                        imageUrl: 'https://placeholder.co/ml',
                        managedBy: p.managedBy,
                        topics: p.topics
                    }));
                    setCourses(mapped);
                }
            }
        } catch (err) {
            console.error("Failed to refresh user data", err);
        }
    }, [isLoggedIn]);

    // Initial load and auth state change sync
    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);

    const handleSelectTopic = useCallback(async (id: number) => {
        if (!isLoggedIn) {
            changeView('LOGIN');
            return;
        }
        try {
            setIsStudyLoading(true);
            const details = await fetchTopicDetails(id);
            setActiveTopic(details);
            setActiveTopicId(id);

            const parentCourse = courses.find(c => c.topics?.some(s => s.id === id));
            const sub = parentCourse?.topics?.find(s => s.id === id);
            if (parentCourse && sub) {
                const pathSlug = parentCourse.title.toLowerCase().includes('java') ? 'java-backend-path' : 'path';
                const topicSlug = slugify(sub.title);
                changeView('STUDY', pathSlug, topicSlug);
            } else {
                changeView('STUDY', 'java-backend-path', slugify(details.title));
            }
        } catch (err) {
            console.error("Failed to load topic details", err);
            showToast("Failed to load topic details", "error");
        } finally {
            setIsStudyLoading(false);
        }
    }, [courses, changeView, showToast, isLoggedIn]);

    const handleToggleTopicComplete = async () => {
        if (!activeTopicId || !activeTopic) return;
        try {
            setIsStudyUpdating(true);
            const nextCompleted = !activeTopic.isCompleted;
            await recordTopicCompletion(activeTopicId, nextCompleted);
            
            // Re-fetch topic details and refresh overall courses & user metrics
            const details = await fetchTopicDetails(activeTopicId);
            setActiveTopic(details);
            await refreshUserData();

            showToast(nextCompleted ? "Topic marked as completed! (+20 bonus points)" : "Topic marked as incomplete.", "success");
        } catch (err) {
            console.error("Failed to update topic status", err);
            showToast("Failed to update topic status", "error");
        } finally {
            setIsStudyUpdating(false);
        }
    };

    const handleToggleSubtopicComplete = async (subtopicId: number, completed: boolean) => {
        if (!activeTopicId || !activeTopic) return;
        try {
            setIsStudyUpdating(true);
            await recordSubtopicCompletion(subtopicId, completed);
            
            // Re-fetch topic details and refresh overall courses & user metrics
            const details = await fetchTopicDetails(activeTopicId);
            setActiveTopic(details);
            await refreshUserData();

            showToast(completed ? "Section marked as read! (+5 points)" : "Section unmarked.", "success");
        } catch (err) {
            console.error("Failed to update subtopic status", err);
            showToast("Failed to update section status", "error");
        } finally {
            setIsStudyUpdating(false);
        }
    };

    const [selectedPathId, setSelectedPathId] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const parts = path.split('/').filter(Boolean);
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

    // Force redirection based on auth state
    useEffect(() => {
        if (!isLoading) {
            if (isLoggedIn && (activeView === 'HOME' || activeView === 'LOGIN')) {
                changeView('DASHBOARD');
            } else if (!isLoggedIn && (activeView === 'DASHBOARD' || activeView === 'STUDY')) {
                changeView('LOGIN');
            }
        }
    }, [isLoggedIn, activeView, isLoading, changeView]);

    const handleViewChange = (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'ROADMAP') => {
        if (view === 'ROADMAP') {
            changeView(view, 'java-backend-path');
        } else {
            changeView(view);
        }
        if (view === 'PATHS' || view === 'ROADMAP') {
            setIsPathsActive(true);
        } else {
            setIsPathsActive(false);
        }
        if (view !== 'ROADMAP') {
            setSelectedPathId(null);
        }
        if (view === 'DASHBOARD') {
            setDashboardTab('activities');
        }
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
        changeView('ROADMAP', slug);
        setIsPathsActive(true);
    };

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Loading Profile Settings...</p>
            </div>
        );
    }

    const selectedPath = courses.find(c => c.id === selectedPathId) || courses[0];

    const overallPathProgress = selectedPath?.topics && selectedPath.topics.length > 0
        ? Math.round(selectedPath.topics.reduce((sum, t) => sum + (t.isCompleted ? 100 : (t.progressPercentage || 0)), 0) / selectedPath.topics.length)
        : (selectedPath?.progressPercentage || 0);

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
                {/* Shared Sticky Sidebar Navigation (hidden on login screen) */}
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

                {/* Main Content Area */}
                {activeView === 'STUDY' ? (
                    activeTopic ? (
                        <TopicStudyConsole
                            topic={activeTopic}
                            onClose={() => {
                                setActiveTopicId(null);
                                setActiveTopic(null);
                                changeView('ROADMAP', 'java-backend-path');
                                refreshUserData();
                            }}
                            onToggleComplete={handleToggleTopicComplete}
                            onToggleSubtopicComplete={handleToggleSubtopicComplete}
                            isUpdating={isStudyUpdating}
                        />
                    ) : null
                ) : (
                    <main className={styles.mainContent}>
                        {/* Top Breadcrumb Bar */}
                        {(activeView === 'PATHS' || activeView === 'ROADMAP') && (
                            <Breadcrumb
                                crumbs={[
                                    { onClick: () => handleViewChange(isLoggedIn ? 'DASHBOARD' : 'HOME') },
                                    ...(activeView === 'ROADMAP'
                                        ? [
                                            { label: 'Paths', onClick: handleSelectPaths },
                                            { label: selectedPath?.title || 'Java Backend Developer Path' },
                                        ]
                                        : [{ label: 'Paths' }]
                                    ),
                                ]}
                            />
                        )}

                        {/* Main View Container */}
                        <div className={activeView === 'DASHBOARD' ? styles.pageContentDashboard : styles.pageContent}>
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
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    isLoggedIn={isLoggedIn}
                                    changeView={handleViewChange}
                                />
                            )}

                            {activeView === 'DASHBOARD' && isLoggedIn && (
                                <Dashboard
                                    profile={profile}
                                    activeTab={dashboardTab}
                                    setActiveTab={setDashboardTab}
                                    onSelectPath={handleSelectPath}
                                    onMetricsLoaded={(streak, points) => {
                                        setUserStreak(streak);
                                        setUserPoints(points);
                                    }}
                                />
                            )}

                            {activeView === 'PATHS' && (
                                <PathsPage
                                    courses={courses}
                                    onSelectPath={handleSelectPath}
                                    isLoggedIn={isLoggedIn}
                                />
                            )}

                            {activeView === 'ROADMAP' && (
                                <PathRoadmapPage
                                    pathTitle={selectedPath?.title || "Java Backend Developer Path"}
                                    managedBy="learnNow"
                                    activitiesCount={selectedPath?.topics?.length || 0}
                                    lastUpdated="Recently"
                                    topics={selectedPath?.topics || []}
                                    progressPercent={overallPathProgress}
                                    onSelectTopic={handleSelectTopic}
                                />
                            )}

                            {activeView === 'LOGIN' && (
                                <LoginPage
                                    signIn={signIn}
                                    signUp={signUp}
                                    changeView={handleViewChange}
                                />
                            )}

                            {activeView === 'VERIFY_EMAIL' && (
                                <VerifyEmailPage
                                    changeView={handleViewChange}
                                    onVerificationSuccess={handleLoginSuccess}
                                />
                            )}
                        </div>
                    </main>
                )}
            </div>

            {/* Backdrop overlay for mobile sidebar */}
            {isExpanded && (
                <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
            )}

            {/* Global Profile Editing Overlay */}
            {isEditingProfile && (
                <ProfileEditModal
                    profile={profile}
                    onSaveProfile={saveProfile}
                    onClose={() => setIsEditingProfile(false)}
                />
            )}

            {/* Path Completion Celebration Modal */}
            {celebratingPath && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary, #1e293b)',
                        color: 'var(--text-primary, #f8fafc)',
                        padding: '36px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        maxWidth: '440px',
                        width: '90%',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(234, 179, 8, 0.3)'
                    }}>
                        <button
                            onClick={() => setCelebratingPath(null)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Sparkles size={40} style={{ color: 'var(--tech-yellow, #eab308)' }} />
                            <Trophy size={48} style={{ color: 'var(--tech-yellow, #eab308)' }} />
                            <Sparkles size={40} style={{ color: 'var(--tech-yellow, #eab308)' }} />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 12px 0' }}>
                            Path Completed!
                        </h2>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                            Congratulations! You finished all topics in <strong>{celebratingPath.title}</strong> and earned <strong>+100 bonus points</strong>!
                        </p>
                        <button
                            onClick={() => setCelebratingPath(null)}
                            style={{
                                backgroundColor: 'var(--tech-blue, #3b82f6)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '12px 28px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Awesome!
                        </button>
                    </div>
                </div>
            )}

            {/* Study Loading Spinner Overlay */}
            {isStudyLoading && (
                <div className={styles.studyLoadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Loading course study material...</p>
                </div>
            )}
        </div>
    );
}
