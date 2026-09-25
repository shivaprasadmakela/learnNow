import React, { Suspense } from 'react';
import styles from '../App.module.css';
import type { Course, UserProfile } from '../../types';
import type { ViewState } from '../../features/dashboard/hooks/useProfileDashboard';

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
const DsaSheetPage = React.lazy(() => import('../../features/dsa').then(m => ({ default: m.DsaSheetPage })));
const ProfilePage = React.lazy(() => import('../../features/profile').then(m => ({ default: m.ProfilePage })));
const PrivacyPolicyPage = React.lazy(() => import('../../features/privacy').then(m => ({ default: m.PrivacyPolicyPage })));
const UnauthorizedAccess = React.lazy(() => import('../../shared/components/ui/UnauthorizedAccess').then(m => ({ default: m.UnauthorizedAccess })));
import { fetchAdminPathById, saveAdminPath, type AdminSubtopicData } from '../../features/iam-admin/api/admin.api';



interface AppViewRendererProps {
    activeView: string;
    editingPathId?: string | null;
    isLoggedIn: boolean;
    profile: UserProfile | null;
    courses: Course[];
    isCoursesLoading?: boolean;
    hasMorePaths?: boolean;
    isLoadingMorePaths?: boolean;
    onLoadMorePaths?: () => void;
    hasMoreTopics?: boolean;
    isLoadingMoreTopics?: boolean;
    onLoadMoreTopics?: () => void;
    selectedPath: Course;
    dashboardTab: 'activities' | 'paths' | 'bookmarks';
    setDashboardTab: (tab: 'activities' | 'paths' | 'bookmarks') => void;
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (firstName: string, lastName: string, email: string, pass: string) => Promise<unknown>;
    signInWithGoogle?: (idToken: string) => Promise<unknown>;
    handleSelectPath: (pathId: number) => void;
    onOpenDsaProblem: (stepSlug: string, problemSlug: string) => void;
    handleSelectTopic: (topicId: number | string, subtopicId?: number | string, subtopicTitle?: string) => void;
    onSelectRecentTopic?: (topicId: number, pathId?: number) => void;
    handleViewChange: (view: ViewState) => void;
    changeView: (view: ViewState, slug?: string) => void;
    handleLoginSuccess: (token: string, profile: UserProfile) => void;
    refreshUserData: (force?: boolean) => void;
    onMetricsLoaded?: (streak: number, points: number) => void;
    onSaveProfile: (fullName: string, avatar: string, bio: string) => void;
    /** Called once the learner has erased their account, so the session can be ended. */
    onAccountErased: () => void;
}

export const AppViewRenderer: React.FC<AppViewRendererProps> = ({
    activeView,
    editingPathId,
    isLoggedIn,
    profile,
    courses,
    isCoursesLoading,
    hasMorePaths,
    isLoadingMorePaths,
    onLoadMorePaths,
    hasMoreTopics,
    isLoadingMoreTopics,
    onLoadMoreTopics,
    selectedPath,
    dashboardTab,
    setDashboardTab,
    signIn,
    signUp,
    signInWithGoogle,
    handleSelectPath,
    onOpenDsaProblem,
    handleSelectTopic,
    onSelectRecentTopic,
    handleViewChange,
    changeView,
    handleLoginSuccess,
    refreshUserData,
    onMetricsLoaded,
    onSaveProfile,
    onAccountErased
}) => {
    const isAdmin = isLoggedIn && profile?.role?.toUpperCase() === 'ADMIN';

    return (
        <div className={
            activeView === 'COMPILER'
                ? styles.pageContentCompiler
                : activeView === 'HOME' || activeView === 'LOGIN' || activeView === 'VERIFY_EMAIL' || activeView === 'PRIVACY' || activeView === 'ADMIN_CREATE_PATH' || activeView === 'ADMIN_EDIT_PATH' || activeView === 'ADMIN_IMPORT_COURSE'
                    ? styles.pageContentFull
                    : activeView === 'DASHBOARD' || activeView === 'DSA' || activeView === 'PROFILE'
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
                        hasMorePaths={hasMorePaths}
                        isLoadingMorePaths={isLoadingMorePaths}
                        onLoadMorePaths={onLoadMorePaths}
                        refreshUserData={refreshUserData}
                        onSelectPath={handleSelectPath}
                        onSelectRecentTopic={onSelectRecentTopic}
                        onOpenDsaSheet={() => changeView('DSA')}
                        onOpenDsaProblem={onOpenDsaProblem}
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

                {activeView === 'PROFILE' && (
                    <ProfilePage
                        profile={profile}
                        onSaveProfile={onSaveProfile}
                        onAccountErased={onAccountErased}
                    />
                )}

                {/* Readable signed out: a privacy notice you must log in to read is not a notice. */}
                {activeView === 'PRIVACY' && (
                    <PrivacyPolicyPage
                        isLoggedIn={isLoggedIn}
                        onOpenProfile={() => changeView('PROFILE')}
                        changeView={changeView}
                    />
                )}

                {activeView === 'COMPILER' && <CompilerPage />}

                {activeView === 'DSA' && (
                    <DsaSheetPage
                        isLoggedIn={isLoggedIn}
                        onOpenProblem={onOpenDsaProblem}
                        onRequireLogin={() => changeView('LOGIN')}
                    />
                )}

                {activeView === 'PATHS' && (
                    <PathsPage
                        courses={courses}
                        onSelectPath={handleSelectPath}
                        isLoggedIn={isLoggedIn}
                        isLoading={isCoursesLoading}
                        hasMorePaths={hasMorePaths}
                        isLoadingMorePaths={isLoadingMorePaths}
                        onLoadMorePaths={onLoadMorePaths}
                    />
                )}

                {activeView === 'TOPICS' && (
                    <TopicsPage
                        pathId={selectedPath?.id}
                        pathTitle={selectedPath?.title || 'Learning Path'}
                        description={selectedPath?.description}
                        managedBy={selectedPath?.managedBy || 'learnNow Team'}
                        activitiesCount={selectedPath?.topics?.length}
                        topics={selectedPath?.topics || []}
                        topicCount={selectedPath?.topicCount}
                        hasMoreTopics={hasMoreTopics}
                        isLoadingMoreTopics={isLoadingMoreTopics}
                        onLoadMoreTopics={onLoadMoreTopics}
                        progressPercent={selectedPath?.progressPercentage || 0}
                        isAdmin={isAdmin}
                        onSelectTopic={handleSelectTopic}
                        onAddTopicToPath={async (topicData) => {
                            if (!selectedPath || !selectedPath.id) return false;
                            try {
                                const fullPath = await fetchAdminPathById(String(selectedPath.id));
                                const updatedTopics = [...(fullPath.topics || []), {
                                    ...topicData,
                                    orderIndex: (fullPath.topics?.length || 0) + 1
                                }];
                                await saveAdminPath({ ...fullPath, topics: updatedTopics });
                                refreshUserData(true);
                                return true;
                            } catch (err) {
                                console.error('Failed to add topic to path:', err);
                                return false;
                            }
                        }}
                        onAddSubtopicToTopic={async (targetTopicId, subtopicData) => {
                            if (!selectedPath || !selectedPath.id) return false;
                            try {
                                const fullPath = await fetchAdminPathById(String(selectedPath.id));
                                const targetIdx = fullPath.topics?.findIndex(t => String(t.id) === String(targetTopicId));
                                if (targetIdx === undefined || targetIdx === -1) return false;

                                const targetTopic = fullPath.topics[targetIdx];
                                const items = Array.isArray(subtopicData) ? subtopicData : [subtopicData];
                                const newSubs = (items as Partial<AdminSubtopicData>[]).map((s, idx: number) => ({
                                    title: s.title ?? '',
                                    content: s.content ?? '',
                                    status: s.status ?? 'DRAFT',
                                    questions: s.questions ?? [],
                                    ...s,
                                    orderIndex: (targetTopic.subtopics?.length || 0) + idx + 1
                                }));

                                fullPath.topics[targetIdx] = {
                                    ...targetTopic,
                                    subtopics: [...(targetTopic.subtopics || []), ...newSubs]
                                };

                                await saveAdminPath(fullPath);
                                refreshUserData(true);
                                return true;
                            } catch (err) {
                                console.error('Failed to add subtopic:', err);
                                return false;
                            }
                        }}
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
