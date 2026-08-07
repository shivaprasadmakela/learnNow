import React, { Suspense } from 'react';
import styles from '../App.module.css';
import type { Course, UserProfile } from '../../types';

// Dynamic Lazy Imports for Code-Splitting & Small Initial Bundle Size
const Home = React.lazy(() => import('../../features/home').then(m => ({ default: m.Home })));
const Dashboard = React.lazy(() => import('../../features/dashboard').then(m => ({ default: m.Dashboard })));
const LoginPage = React.lazy(() => import('../../features/auth').then(m => ({ default: m.LoginPage })));
const VerifyEmailPage = React.lazy(() => import('../../features/auth').then(m => ({ default: m.VerifyEmailPage })));
const PathsPage = React.lazy(() => import('../../features/paths').then(m => ({ default: m.PathsPage })));
const TopicsPage = React.lazy(() => import('../../features/topics').then(m => ({ default: m.TopicsPage })));
const AdminDashboard = React.lazy(() => import('../../features/iam-admin').then(m => ({ default: m.AdminDashboard })));
const ConfigurationEditor = React.lazy(() => import('../../features/iam-admin').then(m => ({ default: m.ConfigurationEditor })));
const CourseImporter = React.lazy(() => import('../../features/iam-admin').then(m => ({ default: m.CourseImporter })));
const CompilerPage = React.lazy(() => import('../../features/compiler').then(m => ({ default: m.CompilerPage })));
const UnauthorizedAccess = React.lazy(() => import('../../shared/components/ui/UnauthorizedAccess').then(m => ({ default: m.UnauthorizedAccess })));



interface AppViewRendererProps {
    activeView: string;
    editingPathId?: string | null;
    isLoggedIn: boolean;
    profile: UserProfile | null;
    courses: Course[];
    isCoursesLoading?: boolean;
    selectedPath: Course;
    dashboardTab: 'activities' | 'paths' | 'bookmarks';
    setDashboardTab: (tab: 'activities' | 'paths' | 'bookmarks') => void;
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (firstName: string, lastName: string, email: string, pass: string) => Promise<unknown>;
    signInWithGoogle?: (idToken: string) => Promise<unknown>;
    handleSelectPath: (pathId: number) => void;
    handleSelectTopic: (topicId: number) => void;
    onSelectRecentTopic?: (topicId: number, pathId?: number) => void;
    handleViewChange: (view: any) => void;
    changeView: (view: any, slug?: string) => void;
    handleLoginSuccess: (token: string, profile: UserProfile) => void;
    refreshUserData: (force?: boolean) => void;
    onMetricsLoaded?: (streak: number, points: number) => void;
}

export const AppViewRenderer: React.FC<AppViewRendererProps> = ({
    activeView,
    editingPathId,
    isLoggedIn,
    profile,
    courses,
    isCoursesLoading,
    selectedPath,
    dashboardTab,
    setDashboardTab,
    signIn,
    signUp,
    signInWithGoogle,
    handleSelectPath,
    handleSelectTopic,
    onSelectRecentTopic,
    handleViewChange,
    changeView,
    handleLoginSuccess,
    refreshUserData,
    onMetricsLoaded
}) => {
    const isAdmin = isLoggedIn && profile?.role?.toUpperCase() === 'ADMIN';

    return (
        <div className={
            activeView === 'COMPILER'
                ? styles.pageContentCompiler
                : activeView === 'HOME' || activeView === 'LOGIN' || activeView === 'VERIFY_EMAIL' || activeView === 'ADMIN_CREATE_PATH' || activeView === 'ADMIN_EDIT_PATH' || activeView === 'ADMIN_IMPORT_COURSE'
                    ? styles.pageContentFull
                    : activeView === 'DASHBOARD'
                        ? styles.pageContentDashboard
                        : styles.pageContent
        }>
            <Suspense fallback={null}>
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
                        searchQuery=""
                        setSearchQuery={() => {}}
                        isLoggedIn={isLoggedIn}
                        changeView={handleViewChange}
                    />
                )}

                {activeView === 'DASHBOARD' && (
                    <Dashboard
                        profile={profile}
                        courses={courses}
                        isCoursesLoading={isCoursesLoading}
                        refreshUserData={refreshUserData}
                        onSelectPath={handleSelectPath}
                        onSelectRecentTopic={onSelectRecentTopic}
                        activeTab={dashboardTab}
                        setActiveTab={setDashboardTab}
                        onMetricsLoaded={onMetricsLoaded}
                    />
                )}

                {activeView === 'LOGIN' && (
                    <LoginPage
                        signIn={signIn}
                        signUp={signUp}
                        signInWithGoogle={signInWithGoogle}
                        changeView={changeView}
                    />
                )}

                {activeView === 'VERIFY_EMAIL' && (
                    <VerifyEmailPage
                        changeView={changeView}
                        onVerificationSuccess={handleLoginSuccess}
                    />
                )}

                {activeView === 'COMPILER' && <CompilerPage />}

                {activeView === 'PATHS' && (
                    <PathsPage
                        courses={courses}
                        onSelectPath={handleSelectPath}
                        isLoggedIn={isLoggedIn}
                        isLoading={isCoursesLoading}
                    />
                )}

                {activeView === 'TOPICS' && (
                    <TopicsPage
                        pathTitle={selectedPath?.title || 'Learning Path'}
                        managedBy={selectedPath?.managedBy || 'learnNow'}
                        topics={selectedPath?.topics || []}
                        progressPercent={selectedPath?.progressPercentage || 0}
                        onSelectTopic={handleSelectTopic}
                    />
                )}

                {activeView === 'ADMIN' && (
                    isAdmin ? (
                        <AdminDashboard
                            onNavigateCreate={() => changeView('ADMIN_CREATE_PATH')}
                            onNavigateImport={() => changeView('ADMIN_IMPORT_COURSE')}
                            onNavigateEdit={(pathId) => changeView('ADMIN_EDIT_PATH', pathId)}
                            refreshUserData={refreshUserData}
                        />
                    ) : (
                        <UnauthorizedAccess changeView={changeView} isLoggedIn={isLoggedIn} />
                    )
                )}

                {activeView === 'ADMIN_IMPORT_COURSE' && (
                    isAdmin ? (
                        <CourseImporter
                            onImportSuccess={(result) => {
                                refreshUserData();
                                changeView('ADMIN_EDIT_PATH', result.pathId);
                            }}
                            onCancel={() => changeView('ADMIN')}
                        />
                    ) : (
                        <UnauthorizedAccess changeView={changeView} isLoggedIn={isLoggedIn} />
                    )
                )}

                {(activeView === 'ADMIN_CREATE_PATH' || activeView === 'ADMIN_EDIT_PATH') && (
                    isAdmin ? (
                        <ConfigurationEditor
                            pathId={activeView === 'ADMIN_EDIT_PATH' ? editingPathId : null}
                            onSaveSuccess={() => {
                                refreshUserData();
                                changeView('ADMIN');
                            }}
                            onCancel={() => changeView('ADMIN')}
                            refreshUserData={refreshUserData}
                        />
                    ) : (
                        <UnauthorizedAccess changeView={changeView} isLoggedIn={isLoggedIn} />
                    )
                )}
            </Suspense>
        </div>
    );
};

export default AppViewRenderer;
