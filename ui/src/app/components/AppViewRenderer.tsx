import React from 'react';
import { Home } from '../../features/home';
import { Dashboard } from '../../features/dashboard';
import { LoginPage, VerifyEmailPage } from '../../features/auth';
import { PathsPage } from '../../features/paths';
import { TopicsPage } from '../../features/topics';
import { AdminDashboard, ConfigurationEditor, CourseImporter } from '../../features/iam-admin';
import { CompilerPage } from '../../features/compiler';
import { UnauthorizedAccess } from '../../shared/components/ui/UnauthorizedAccess';
import styles from '../App.module.css';
import type { Course, UserProfile } from '../../types';

interface AppViewRendererProps {
    activeView: string;
    editingPathId?: string | null;
    isLoggedIn: boolean;
    profile: UserProfile | null;
    courses: Course[];
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
    refreshUserData: () => void;
}

export const AppViewRenderer: React.FC<AppViewRendererProps> = ({
    activeView,
    editingPathId,
    isLoggedIn,
    profile,
    courses,
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
    refreshUserData
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
                    onSelectPath={handleSelectPath}
                    onSelectRecentTopic={onSelectRecentTopic}
                    activeTab={dashboardTab}
                    setActiveTab={setDashboardTab}
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
        </div>
    );
};

export default AppViewRenderer;
