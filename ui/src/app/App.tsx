import { useState, useEffect } from 'react';
import { useLearning, CourseDetail, LessonReader } from '../features/learning';
import { Home } from '../features/home';
import { Dashboard } from '../features/dashboard';
import { Certificate } from '../features/certificate';
import { Header, Sidebar, AuthModal } from '../shared/components';
import styles from './App.module.css';

export default function App() {
    const {
        activeView,
        changeView,
        courses,
        currentCourse,
        activeLesson,
        progress,
        profile,
        isLoading,
        error,
        theme,
        toggleTheme,
        selectCourse,
        selectLesson,
        markLessonCompleted,
        submitQuiz,
        resetAllProgress,
        saveProfile,

        // Auth properties
        isLoggedIn,
        authModalOpen,
        setAuthModalOpen,
        signUp,
        signIn,
        signOut,
        signInWithGoogle
    } = useLearning();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollectionsExpanded, setIsCollectionsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Force redirection based on auth state
    useEffect(() => {
        if (!isLoading) {
            if (isLoggedIn && activeView === 'HOME') {
                changeView('DASHBOARD');
            } else if (!isLoggedIn && (activeView === 'DASHBOARD' || activeView === 'CERTIFICATE')) {
                changeView('HOME');
            }
        }
    }, [isLoggedIn, activeView, isLoading, changeView]);

    if (isLoading && courses.length === 0) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Loading Learn with Shiva Platform...</p>
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
                activeView={activeView}
                changeView={changeView}
                profile={profile}
                progress={progress}
                theme={theme}
                toggleTheme={toggleTheme}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isLoggedIn={isLoggedIn}
                setAuthModalOpen={setAuthModalOpen}
                signOut={signOut}
            />

            <div className={styles.appLayout}>
                {/* Shared Sticky Sidebar Navigation */}
                <Sidebar
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    isCollectionsExpanded={isCollectionsExpanded}
                    setIsCollectionsExpanded={setIsCollectionsExpanded}
                    activeView={activeView}
                    changeView={changeView}
                    selectCourse={selectCourse}
                    isLoggedIn={isLoggedIn}
                />

                {/* Main Content Area */}
                <main className={styles.mainContent}>
                    {activeView === 'HOME' && (
                        <Home 
                            courses={courses}
                            progress={progress}
                            onSelectCourse={(id) => {
                                if (isLoggedIn) selectCourse(id);
                                else setAuthModalOpen(true);
                            }}
                            onResetProgress={resetAllProgress}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            isLoggedIn={isLoggedIn}
                            setAuthModalOpen={setAuthModalOpen}
                        />
                    )}

                    {activeView === 'COURSE_DETAIL' && (
                        <CourseDetail 
                            course={currentCourse}
                            progress={progress}
                            onBack={() => changeView('HOME')}
                            onStartLesson={(id) => {
                                if (isLoggedIn) selectLesson(id);
                                else setAuthModalOpen(true);
                            }}
                        />
                    )}

                    {activeView === 'LESSON_READER' && currentCourse && (
                        <LessonReader 
                            course={currentCourse}
                            lesson={activeLesson}
                            progress={progress}
                            onBack={() => selectCourse(currentCourse.id)}
                            onSelectLesson={selectLesson}
                            onMarkCompleted={markLessonCompleted}
                            onSubmitQuiz={submitQuiz}
                            onChangeView={changeView}
                        />
                    )}

                    {activeView === 'DASHBOARD' && (
                        <Dashboard 
                            courses={courses}
                            progress={progress}
                            profile={profile}
                            onBack={() => changeView('HOME')}
                            onResetProgress={resetAllProgress}
                            onSelectCourse={selectCourse}
                            onSelectLesson={selectLesson}
                            onSaveProfile={saveProfile}
                            onChangeView={changeView}
                        />
                    )}

                    {activeView === 'CERTIFICATE' && (
                        <Certificate 
                            course={currentCourse || (courses.length > 0 ? courses[0] : null)}
                            profile={profile}
                            onBack={() => changeView('DASHBOARD')}
                        />
                    )}
                </main>
            </div>

            {/* Backdrop overlay for mobile sidebar */}
            {isExpanded && (
                <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
            )}

            {/* Authentication Glassmorphic Modal */}
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
