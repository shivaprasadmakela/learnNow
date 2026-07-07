import { useState, useEffect } from 'react';
import { Dashboard, useProfileDashboard } from '../features/dashboard';
import { Home } from '../features/home';
import { LoginPage } from '../features/auth';
import { Header, Sidebar } from '../shared/components';
import styles from './App.module.css';
import type { Course } from '../types';

const mockCourses: Course[] = [
    {
        id: 1,
        title: "Professional Machine Learning Engineer Certification",
        description: "Build a Certification Study Guide: PMLE. Learn how to design, build, and productionize ML models using Google Cloud technology.",
        category: "Cloud",
        duration: "12 hours",
        level: "Advanced",
        imageUrl: "https://placeholder.co/ml"
    },
    {
        id: 2,
        title: "Deploy and Manage Generative AI Models",
        description: "This learning path provides a comprehensive introduction to machine learning operations (MLOps) for generative AI models on Google Cloud.",
        category: "Cloud",
        duration: "8 hours",
        level: "Intermediate",
        imageUrl: "https://placeholder.co/genai-deploy"
    },
    {
        id: 3,
        title: "Build and Modernize Applications With Generative AI",
        description: "This learning path is for application developers who want to enhance their projects with cutting edge generative AI capabilities and modern frameworks.",
        category: "Fullstack",
        duration: "10 hours",
        level: "Intermediate",
        imageUrl: "https://placeholder.co/genai-apps"
    },
    {
        id: 4,
        title: "Integrate Generative AI Into Your Data Workflow",
        description: "This learning path is for data professionals who want to integrate generative AI tools and LLMs into their existing data engineering pipelines.",
        category: "Backend",
        duration: "6 hours",
        level: "Advanced",
        imageUrl: "https://placeholder.co/genai-data"
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
                changeView={changeView}
                profile={profile}
                theme={theme}
                toggleTheme={toggleTheme}
                isLoggedIn={isLoggedIn}
                signOut={signOut}
            />

            <div className={styles.appLayout}>
                {/* Shared Sticky Sidebar Navigation (hidden on login screen) */}
                {activeView !== 'LOGIN' && (
                    <Sidebar
                        isExpanded={isExpanded}
                        activeView={activeView}
                        changeView={changeView}
                        isLoggedIn={isLoggedIn}
                    />
                )}

                {/* Main Content Area */}
                <main className={styles.mainContent}>
                    {activeView === 'HOME' && (
                        <Home
                            courses={mockCourses}
                            progress={[]}
                            onSelectCourse={() => {
                                if (isLoggedIn) changeView('DASHBOARD');
                                else changeView('LOGIN');
                            }}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            isLoggedIn={isLoggedIn}
                            changeView={changeView}
                        />
                    )}

                    {activeView === 'DASHBOARD' && isLoggedIn && (
                        <Dashboard
                            profile={profile}
                            onSaveProfile={saveProfile}
                        />
                    )}

                    {activeView === 'LOGIN' && (
                        <LoginPage
                            signIn={signIn}
                            signUp={signUp}
                            changeView={changeView}
                        />
                    )}
                </main>
            </div>

            {/* Backdrop overlay for mobile sidebar */}
            {isExpanded && (
                <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
            )}
        </div>
    );
}
