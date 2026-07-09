import { useState, useEffect } from 'react';
import { Dashboard, useProfileDashboard, ProfileEditModal, fetchPaths, PathsModule } from '../features/dashboard';
import { Home } from '../features/home';
import { LoginPage } from '../features/auth';
import { Header, Sidebar } from '../shared/components';
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

    const handleViewChange = (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS') => {
        changeView(view);
        if (view === 'PATHS') {
            setIsPathsActive(true);
        } else {
            setIsPathsActive(false);
        }
        if (view === 'DASHBOARD') {
            setDashboardTab('activities');
        }
    };

    const handleSelectPaths = () => {
        setIsPathsActive(true);
        changeView('PATHS');
    };

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Loading Profile Settings...</p>
            </div>
        );
    }

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
                        <PathsModule
                            courses={courses}
                            isLoggedIn={isLoggedIn}
                            changeView={handleViewChange}
                        />
                    )}

                    {activeView === 'LOGIN' && (
                        <LoginPage
                            signIn={signIn}
                            signUp={signUp}
                            changeView={handleViewChange}
                        />
                    )}
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
