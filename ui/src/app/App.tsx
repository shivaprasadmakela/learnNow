import { useState, useEffect, useCallback } from 'react';
import { Dashboard, useProfileDashboard, ProfileEditModal } from '../features/dashboard';
import { PathsPage } from '../features/paths';
import { fetchPaths, fetchSubtopicDetails, toggleSubtopicComplete } from '../shared/api';
import type { SubtopicDetails } from '../shared/api';
import { Home } from '../features/home';
import { RoadmapPage, StudyConsole } from '../features/roadmap';
import { LoginPage } from '../features/auth';
import { Header, Sidebar, Breadcrumb } from '../shared/components';
import { useToast } from '../shared/components/feedback/Toast';
import styles from './App.module.css';
import type { Course } from '../types';

const mockCourses: Course[] = [
    {
        id: 1,
        title: "Java Backend Path",
        description: "Learn core Java programming, object-oriented design patterns, collections framework, multithreading, and Spring Boot enterprise APIs.",
        category: "Backend",
        duration: "12 hours",
        level: "Advanced",
        imageUrl: "https://placeholder.co/ml",
        subtopics: []
    }
];

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
        signIn
    } = useProfileDashboard();
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const { showToast } = useToast();
    const [activeSubtopicId, setActiveSubtopicId] = useState<number | null>(null);
    const [activeSubtopic, setActiveSubtopic] = useState<SubtopicDetails | null>(null);
    const [isStudyLoading, setIsStudyLoading] = useState(false);
    const [isStudyUpdating, setIsStudyUpdating] = useState(false);

    const handleSelectSubtopic = useCallback(async (id: number) => {
        try {
            setIsStudyLoading(true);
            const details = await fetchSubtopicDetails(id);
            setActiveSubtopic(details);
            setActiveSubtopicId(id);

            // Find parent course slug dynamically
            const parentCourse = courses.find(c => c.subtopics?.some(s => s.id === id));
            const sub = parentCourse?.subtopics?.find(s => s.id === id);
            if (parentCourse && sub) {
                const pathSlug = parentCourse.title.toLowerCase().includes('java') ? 'java-backend-path' : 'path';
                const subtopicSlug = slugify(sub.title);
                changeView('STUDY', pathSlug, subtopicSlug);
            } else {
                changeView('STUDY', 'java-backend-path', slugify(details.title));
            }
        } catch (err) {
            console.error("Failed to load subtopic details", err);
            showToast("Failed to load subtopic details", "error");
        } finally {
            setIsStudyLoading(false);
        }
    }, [courses, changeView, showToast]);

    const handleToggleStudyComplete = async () => {
        if (!activeSubtopicId || !activeSubtopic) return;
        try {
            setIsStudyUpdating(true);
            const updated = await toggleSubtopicComplete(activeSubtopicId);
            
            // Update active subtopic state
            setActiveSubtopic(prev => prev ? { ...prev, isCompleted: updated.isCompleted } : null);
            
            // Also update the course path state to refresh the roadmap checkboxes!
            setCourses(prevCourses => {
                return prevCourses.map(course => {
                    if (course.subtopics) {
                        const updatedSubtopics = course.subtopics.map(sub => {
                            if (sub.id === activeSubtopicId) {
                                return { ...sub, isCompleted: updated.isCompleted };
                            }
                            return sub;
                        });
                        return { ...course, subtopics: updatedSubtopics };
                    }
                    return course;
                });
            });
            showToast(updated.isCompleted ? "Subtopic marked as completed!" : "Subtopic marked as incomplete.", "success");
        } catch (err) {
            console.error("Failed to update subtopic status", err);
            showToast("Failed to update subtopic status", "error");
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

    // Fetch paths from backend
    useEffect(() => {
        const loadPaths = async () => {
            try {
                const fetched = await fetchPaths();
                if (fetched && fetched.length > 0) {
                    const mapped: Course[] = fetched.map(p => ({
                        id: p.id,
                        title: p.title,
                        description: p.description,
                        category: p.category,
                        duration: '10 hours',
                        level: 'Intermediate',
                        imageUrl: 'https://placeholder.co/ml',
                        managedBy: p.managedBy,
                        subtopics: p.subtopics
                    }));
                    setCourses(mapped);

                    // Dynamically resolve ID on initial mount refresh
                    if (typeof window !== 'undefined') {
                        const pathName = window.location.pathname;
                        const parts = pathName.split('/').filter(Boolean);
                        if (parts.length >= 2 && parts[0] === 'paths') {
                            const pathSlug = parts[1];
                            const javaCourse = mapped.find(c => {
                                const slug = c.title.toLowerCase().includes('java') ? 'java-backend-path' : '';
                                return slug === pathSlug;
                            });
                            
                            if (javaCourse) {
                                setSelectedPathId(javaCourse.id);
                                
                                if (parts.length === 3) {
                                    const subtopicSlug = parts[2];
                                    const matchingSubtopic = javaCourse.subtopics?.find(s => {
                                        return slugify(s.title) === subtopicSlug;
                                    });
                                    if (matchingSubtopic) {
                                        (async () => {
                                            try {
                                                setIsStudyLoading(true);
                                                const details = await fetchSubtopicDetails(matchingSubtopic.id);
                                                setActiveSubtopic(details);
                                                setActiveSubtopicId(matchingSubtopic.id);
                                            } catch (err) {
                                                console.error("Failed to load subtopic details on refresh", err);
                                            } finally {
                                                setIsStudyLoading(false);
                                            }
                                        })();
                                    }
                                }
                            }
                        }
                    }
                } else {
                    setCourses(mockCourses);
                }
            } catch (err) {
                console.error("Failed to load paths from backend, falling back to static", err);
                setCourses(mockCourses);
            }
        };
        loadPaths();
    }, []);

    // Force redirection based on auth state
    useEffect(() => {
        if (!isLoading) {
            if (isLoggedIn && (activeView === 'HOME' || activeView === 'LOGIN')) {
                changeView('DASHBOARD');
            } else if (!isLoggedIn && activeView === 'DASHBOARD') {
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
        setSelectedPathId(pathId);
        // Map path ID to slug
        const path = courses.find(c => c.id === pathId) || mockCourses.find(c => c.id === pathId);
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
    const selectedPath = courses.find(c => c.id === selectedPathId) || mockCourses.find(c => c.id === selectedPathId) || mockCourses[0];

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
                    activeSubtopic ? (
                        <StudyConsole
                            subtopic={activeSubtopic}
                            onClose={() => {
                                setActiveSubtopicId(null);
                                setActiveSubtopic(null);
                                changeView('ROADMAP', 'java-backend-path');
                            }}
                            onToggleComplete={handleToggleStudyComplete}
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
                                    progress={[]}
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
                                    courses={courses}
                                    activeTab={dashboardTab}
                                    setActiveTab={setDashboardTab}
                                />
                            )}

                            {activeView === 'PATHS' && (
                                <PathsPage
                                    courses={courses}
                                    onSelectPath={handleSelectPath}
                                />
                            )}

                            {activeView === 'ROADMAP' && (
                                <RoadmapPage
                                    pathTitle={selectedPath?.title || "Java Backend Developer Path"}
                                    managedBy="learnNow"
                                    activitiesCount={selectedPath?.subtopics?.length || 0}
                                    lastUpdated="2 days ago"
                                    subtopics={selectedPath?.subtopics || []}
                                    progressPercent={
                                        selectedPath?.subtopics && selectedPath.subtopics.length > 0
                                            ? Math.round((selectedPath.subtopics.filter(s => s.isCompleted).length / selectedPath.subtopics.length) * 100)
                                            : 0
                                    }
                                    onSelectSubtopic={handleSelectSubtopic}
                                />
                            )}

                            {activeView === 'LOGIN' && (
                                <LoginPage
                                    signIn={signIn}
                                    signUp={signUp}
                                    changeView={handleViewChange}
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
