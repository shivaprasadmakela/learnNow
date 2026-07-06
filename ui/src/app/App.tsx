import { useState } from 'react';
import { Dashboard, useProfileDashboard } from '../features/dashboard';

import { Header, Sidebar, AuthModal } from '../shared/components';
import styles from './App.module.css';

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
        authModalOpen,
        setAuthModalOpen,
        signUp,
        signIn,
        signOut,
        signInWithGoogle
    } = useProfileDashboard();

    const [isExpanded, setIsExpanded] = useState(false);

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
                setAuthModalOpen={setAuthModalOpen}
                signOut={signOut}
            />

            <div className={styles.appLayout}>
                {/* Shared Sticky Sidebar Navigation */}
                <Sidebar
                    isExpanded={isExpanded}
                    activeView={activeView}
                    changeView={changeView}
                    isLoggedIn={isLoggedIn}
                />

                {/* Main Content Area */}
                <main className={styles.mainContent}>
                    {activeView === 'DASHBOARD' && (
                        <Dashboard
                            profile={profile}
                            onSaveProfile={saveProfile}
                        />
                    )}
                </main>
            </div>

            {/* Backdrop overlay for mobile sidebar */}
            {isExpanded && (
                <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
            )}

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                signUp={signUp}
                signIn={signIn}
                signInWithGoogle={signInWithGoogle}
            />
        </div>
    );
}
