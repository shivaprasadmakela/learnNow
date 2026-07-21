import React, { useEffect } from 'react';
import { Flame, Trophy, Play, CheckCircle2, ChevronRight, Activity, BookOpen } from 'lucide-react';
import type { UserProfile } from '../../../types';
import { useDashboard } from '../hooks/useDashboard';
import styles from '../styles/Dashboard.module.css';
import owlPointer from '../../../assets/owl-pointer.png';

interface DashboardProps {
    profile: UserProfile | null;
    activeTab?: 'activities' | 'paths';
    setActiveTab?: (tab: 'activities' | 'paths') => void;
    onSelectPath: (pathId: number) => void;
    onMetricsLoaded?: (streak: number, points: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    profile,
    activeTab = 'activities',
    setActiveTab,
    onSelectPath,
    onMetricsLoaded
}) => {
    const { dashboardData, isLoading, error } = useDashboard();

    useEffect(() => {
        if (dashboardData && onMetricsLoaded) {
            onMetricsLoaded(dashboardData.currentStreak, dashboardData.totalPoints);
        }
    }, [dashboardData, onMetricsLoaded]);

    if (isLoading) {
        return (
            <div className={styles.container} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className={styles.loadingSkeleton}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard metrics...</p>
                </div>
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className={styles.container} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className={styles.errorContainer}>
                    <p style={{ color: 'var(--tech-red)' }}>⚠️ {error || 'Failed to load progress data.'}</p>
                </div>
            </div>
        );
    }

    const { currentStreak, totalPoints, weeklyCalendar, recentTopics = [], paths, banner } = dashboardData;

    // Grab stats count for summary grid
    const totalPathsCount = paths.length;
    const completedPathsCount = paths.filter(p => p.progressPercentage === 100).length;
    const completedTopicsCount = paths.reduce((sum, p) => sum + p.completedTopicsCount, 0);
    const totalTopicsCount = paths.reduce((sum, p) => sum + p.totalTopicsCount, 0);

    return (
        <div className={styles.container}>
            {profile && (
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                        Welcome back, {profile.fullName || 'Learner'}!
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0 0', fontSize: '0.95rem' }}>
                        Ready to continue your learning progress?
                    </p>
                </div>
            )}
            {/* Main Google Skills Dashboard Grid */}
            <div className={styles.dashboardGrid}>
                {/* Left Column: Course Card, Tabs & Grid Cards */}
                <div className={styles.leftCol}>
                    {/* Current Course Banner */}
                    <div className={styles.currentCourseCard}>
                        <div className={styles.courseCardLeft}>
                            <div className={styles.courseCardIllustration}>
                                <img src={owlPointer} className={styles.owlPointerImg} alt="Learning Path" />
                            </div>
                        </div>
                        <div className={styles.courseCardRight}>
                            <span className={styles.courseCardPreTitle}>
                                {banner.type === 'FEATURED' ? 'Recommended Path' : 'Review Path'} &gt;
                            </span>
                            <h2 className={styles.courseCardTitle}>{banner.pathTitle}</h2>
                            <p className={styles.courseCardDesc}>{banner.pathDescription}</p>
                            {(() => {
                                const bannerPath = paths.find(p => p.id === banner.pathId);
                                const isPathStarted = bannerPath ? (bannerPath.progressPercentage > 0 || bannerPath.completedTopicsCount > 0) : false;
                                const buttonLabel = isPathStarted || banner.type === 'REVIEW' ? 'Continue' : 'Start';
                                return (
                                    <button
                                        type="button"
                                        className={styles.startButton}
                                        onClick={() => banner.pathId && onSelectPath(banner.pathId)}
                                        disabled={!banner.pathId}
                                    >
                                        <Play size={16} className={styles.playIcon} fill="currentColor" />
                                        <span>{buttonLabel}</span>
                                    </button>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className={styles.tabContainer}>
                        <button
                            className={`${styles.tabLink} ${activeTab === 'activities' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab && setActiveTab('activities')}
                        >
                            Recent Activity
                        </button>
                        <button
                            className={`${styles.tabLink} ${activeTab === 'paths' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab && setActiveTab('paths')}
                        >
                            Learning Paths
                        </button>
                    </div>

                    {/* Tab Content Panels */}
                    <div className={styles.tabContent}>
                        {activeTab === 'activities' ? (
                            <div className={styles.activitiesList}>
                                {recentTopics.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <Activity size={24} style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }} />
                                        <p>Visit or complete topics to see your recent topic progress here.</p>
                                    </div>
                                ) : (
                                    recentTopics.map((item) => (
                                        <div key={item.topicId} className={styles.activityFeedItem} style={{
                                            padding: 'var(--space-4)',
                                            borderBottom: '1px solid var(--border-color)',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--space-3)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                                                    <div style={{
                                                        backgroundColor: item.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                        color: item.completed ? 'var(--tech-green)' : 'var(--tech-blue)',
                                                        borderRadius: '50%',
                                                        padding: 'var(--space-2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <BookOpen size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>
                                                            {item.topicTitle}
                                                        </h4>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {item.pathTitle}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    color: item.completed ? 'var(--tech-green)' : 'var(--tech-blue)',
                                                    backgroundColor: item.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {item.completed ? 'Completed' : `${item.progressPercentage}% Done`}
                                                </span>
                                            </div>

                                            {/* Topic completion percentage bar */}
                                            <div style={{
                                                width: '100%',
                                                height: '5px',
                                                backgroundColor: 'var(--border-color)',
                                                borderRadius: '3px',
                                                overflow: 'hidden',
                                                marginTop: '8px'
                                            }}>
                                                <div style={{
                                                    width: `${item.progressPercentage}%`,
                                                    height: '100%',
                                                    backgroundColor: item.completed ? 'var(--tech-green)' : 'var(--tech-blue)',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className={styles.pathsContainer}>
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 className={styles.cardHeaderTitle} style={{ fontSize: '1.25rem' }}>Learning Paths</h3>
                                </div>
                                <div className={styles.cardsGrid}>
                                    {paths.map((path) => (
                                        <div key={path.id} className={styles.previewCard}>
                                            <div className={styles.cardTags}>
                                                <span className={`${styles.cardTag} ${styles.tagPath}`}>
                                                    Path
                                                </span>
                                                <span className={styles.progressBadge} style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--tech-blue)',
                                                    fontWeight: 600
                                                }}>
                                                    {path.progressPercentage}% Complete
                                                </span>
                                            </div>
                                            <h3 className={styles.cardTitle}>{path.title}</h3>
                                            <p className={styles.cardDesc}>{path.description}</p>
                                            
                                            {/* Progress Bar */}
                                            <div style={{
                                                width: '100%',
                                                height: '6px',
                                                backgroundColor: 'var(--border-color)',
                                                borderRadius: 'var(--radius-sm)',
                                                overflow: 'hidden',
                                                marginTop: 'var(--space-4)',
                                                marginBottom: 'var(--space-2)'
                                            }}>
                                                <div style={{
                                                    width: `${path.progressPercentage}%`,
                                                    height: '100%',
                                                    backgroundColor: 'var(--tech-blue)',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>

                                            <div className={styles.cardFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {path.completedTopicsCount} / {path.totalTopicsCount} Topics
                                                </span>
                                                <button
                                                    type="button"
                                                    className={styles.circleArrowBtn}
                                                    title={`Explore ${path.title}`}
                                                    onClick={() => onSelectPath(path.id)}
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Streak, Achievements & Progress Table */}
                <div className={styles.rightCol}>
                    {/* Weekly Streak Card */}
                    <div className={styles.streakCard}>
                        <div className={styles.streakInfo}>
                            <span className={styles.streakBigNumber}>{currentStreak}</span>
                            <div className={styles.streakLabelContainer}>
                                <Flame className={styles.streakFlameIcon} size={24} style={{ color: 'var(--tech-orange)' }} />
                                <span className={styles.streakSubLabel}>Current streak</span>
                            </div>
                        </div>

                        <div className={styles.weekCalendar}>
                            {weeklyCalendar.map((day, idx) => (
                                <div key={idx} className={styles.calendarDay}>
                                    <div className={`${styles.dayIndicatorCircle} ${day.completed ? styles.dayCircleActive : ''} ${day.isDotted ? styles.dayCircleDotted : ''}`}>
                                        {day.completed ? (
                                            <CheckCircle2 size={14} style={{ color: 'var(--tech-green)' }} />
                                        ) : null}
                                    </div>
                                    <span className={styles.calendarDayLabel}>{day.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Points Achievements Card */}
                    <div className={styles.achievementsCard}>
                        <div className={styles.cardHeaderWithAction}>
                            <h3 className={styles.cardHeaderTitle}>Points & Rank</h3>
                            <Trophy size={20} style={{ color: 'var(--tech-yellow)' }} />
                        </div>

                        <div style={{ padding: 'var(--space-2) 0', textAlign: 'center' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--tech-yellow)' }}>
                                {totalPoints}
                            </span>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Total Points Earned
                            </p>
                        </div>
                    </div>

                    {/* Progress Stats Table Card */}
                    <div className={styles.progressCard}>
                        <h3 className={styles.cardHeaderTitle} style={{ marginBottom: '16px' }}>Overall Progress</h3>
                        <div className={styles.progressStatsGrid}>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>🎓 Active Paths</span>
                                <span className={styles.progressValue}>{totalPathsCount}</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>🏆 Completed Paths</span>
                                <span className={styles.progressValue}>{completedPathsCount}</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>📖 Total Topics</span>
                                <span className={styles.progressValue}>{totalTopicsCount}</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>✅ Completed Topics</span>
                                <span className={styles.progressValue}>{completedTopicsCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
