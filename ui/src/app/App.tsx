import { useState, useEffect } from 'react';
import { Dashboard, useProfileDashboard, ProfileEditModal } from '../features/dashboard';
import { PathsPage } from '../features/paths';
import { fetchPaths } from '../shared/api';
import { Home } from '../features/home';
import { RoadmapPage } from '../features/roadmap';
import type { Subtopic } from '../features/roadmap';
import { LoginPage } from '../features/auth';
import { Header, Sidebar, Breadcrumb } from '../shared/components';
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
        imageUrl: "https://placeholder.co/ml"
    }
];

const javaSubtopics: Subtopic[] = [
    {
        id: 1,
        title: "Core Java Basics (The Foundation)",
        description: "Master primitive types, flow control, arrays, and syntax basics. Set up your JDK development environment.",
        category: "course",
        duration: "2 hours",
        isCompleted: true
    },
    {
        id: 2,
        title: "Object-Oriented Programming (OOP)",
        description: "Delve deep into classes, interfaces, inheritance, polymorphism, encapsulation, and abstraction.",
        category: "course",
        duration: "3 hours",
        isCompleted: false
    },
    {
        id: 3,
        title: "Java Collections Framework & Generics",
        description: "Work with Lists, Sets, Maps, Queues, and define type-safe generic classes and methods.",
        category: "course",
        duration: "2 hours",
        isCompleted: false
    },
    {
        id: 4,
        title: "Modern Java & Advanced Features (Java 8 to 21)",
        description: "Learn lambda expressions, streams, records, pattern matching, virtual threads, and new API features.",
        category: "course",
        duration: "4 hours",
        isCompleted: false
    },
    {
        id: 5,
        title: "Exceptions, File I/O, and Databases",
        description: "Handle runtime errors, use input/output streams, read/write files, and integrate with JDBC databases.",
        category: "course",
        duration: "2.5 hours",
        isCompleted: false
    },
    {
        id: 6,
        title: "Concurrency & Multithreading (Advanced)",
        description: "Understand thread creation, synchronization, volatile fields, lock frameworks, executors, and thread safety.",
        category: "course",
        duration: "3 hours",
        isCompleted: false
    },
    {
        id: 7,
        title: "JVM Internals & Memory Management (Deep Dive)",
        description: "Explore garbage collection, classloaders, stack vs heap memory, and profiling application performance.",
        category: "lab",
        duration: "1.5 hours",
        isCompleted: false
    },
    {
        id: 8,
        title: "Reactive Programming & Spring WebFlux (Enterprise Level)",
        description: "Build non-blocking, asynchronous reactive microservices using Project Reactor and WebFlux.",
        category: "course",
        duration: "4 hours",
        isCompleted: false
    }
];

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
    const [selectedPathId, setSelectedPathId] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const parts = path.split('/').filter(Boolean);
            if (parts.length === 2 && parts[0] === 'paths' && parts[1] === 'java-backend-path') {
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
                        managedBy: p.managedBy
                    }));
                    setCourses(mapped);
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

            <div className={styles.appLayout}>
                {/* Shared Sticky Sidebar Navigation (hidden on login screen) */}
                {activeView !== 'LOGIN' && (
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
                                activitiesCount={javaSubtopics.length}
                                lastUpdated="2 days ago"
                                subtopics={javaSubtopics}
                                progressPercent={12.5}
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
        </div>
    );
}
