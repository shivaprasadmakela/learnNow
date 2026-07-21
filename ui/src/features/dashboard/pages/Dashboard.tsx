import React, { useEffect } from 'react';
import { Play, Check } from 'lucide-react';
import type { UserProfile } from '../../../types';
import { useDashboard } from '../hooks/useDashboard';
import styles from '../styles/Dashboard.module.css';
import owlPointer from '../../../assets/owl-pointer.png';
import { LearningCard } from '../../../shared/components/cards';
import { StreakFlameIcon } from '../../../shared/components/StreakFlameIcon';

interface DashboardProps {
    profile: UserProfile | null;
    activeTab?: 'activities' | 'paths';
    setActiveTab?: (tab: 'activities' | 'paths') => void;
    onSelectPath: (pathId: number) => void;
    onMetricsLoaded?: (streak: number, points: number) => void;
}

const getInitials = (name: string): string => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const getAvatarColorClass = (userId: string, cssStyles: Record<string, string>): string => {
    const bgClasses = [
        cssStyles.avatarBgRose,
        cssStyles.avatarBgAmber,
        cssStyles.avatarBgSky,
        cssStyles.avatarBgEmerald,
        cssStyles.avatarBgViolet
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % bgClasses.length;
    return bgClasses[index];
};

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

    const {
        currentStreak,
        weeklyCalendar,
        recentTopics = [],
        paths = [],
        banner,
        weeklyLeaderboard = []
    } = dashboardData;

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
                                        <i className="fa-solid fa-seedling" style={{ fontSize: '2.2rem', color: 'var(--text-tertiary)', marginBottom: '14px' }} aria-hidden="true" />
                                        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
                                            Visit or complete topics to see your recent topic progress here.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                        {recentTopics.map((item) => (
                                            <LearningCard
                                                key={item.topicId}
                                                badgeLabel="Topic"
                                                title={item.topicTitle}
                                                description={item.pathTitle ? `Path: ${item.pathTitle}` : undefined}
                                                progressPercentage={item.progressPercentage}
                                                showProgress={true}
                                                isCompleted={item.completed}
                                                onClick={() => onSelectPath(item.topicId)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.pathsSection}>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                    {paths.map((path) => (
                                        <LearningCard
                                            key={path.id}
                                            badgeLabel={path.category || 'Path'}
                                            title={path.title}
                                            description={path.description}
                                            footerText={`${path.completedTopicsCount} / ${path.totalTopicsCount} Topics`}
                                            progressPercentage={path.progressPercentage}
                                            showProgress={typeof path.progressPercentage === 'number' && path.progressPercentage > 0}
                                            onClick={() => onSelectPath(path.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Streak, League & Progress Table */}
                <div className={styles.rightCol}>
                    {/* Weekly Streak Card */}
                    <div className={styles.streakCard}>
                        <div className={styles.streakInfo}>
                            <span className={styles.streakBigNumber}>
                                {String(currentStreak).split('').map((digit, idx) => (
                                    <i key={idx} className={`fa-regular fa-${digit}`} aria-hidden="true" />
                                ))}
                            </span>
                            <div className={styles.streakFlameStack}>
                                <StreakFlameIcon streak={currentStreak} size={56} className={styles.streakCanvas} />
                                <div className={styles.streakSubLabel}>
                                    Current<br />streak
                                </div>
                            </div>
                        </div>

                        <div className={styles.streakDivider} />

                        <div className={styles.weekCalendar}>
                            {weeklyCalendar.map((day, idx) => {
                                const todayStr = new Date().toISOString().slice(0, 10);
                                const isToday = day.date === todayStr;
                                return (
                                    <div key={idx} className={styles.calendarDay}>
                                        <div
                                            className={`${styles.dayIndicatorCircle} ${day.completed
                                                ? styles.dayCircleActive
                                                : isToday
                                                    ? styles.dayCircleToday
                                                    : day.isDotted
                                                        ? styles.dayCircleDotted
                                                        : ''
                                                }`}
                                        >
                                            {day.completed && <Check size={12} strokeWidth={3} style={{ color: '#ffffff' }} />}
                                        </div>
                                        <span className={`${styles.calendarDayLabel} ${isToday ? styles.calendarDayLabelToday : ''}`}>
                                            {day.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* League Leaderboard Card */}
                    <div className={styles.leagueCard}>
                        <div className={styles.leagueHeader}>
                            <h2 className={styles.leagueTitle}>League</h2>
                            <div className={styles.infoIconWrapper}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={styles.infoIconSvg}>
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <div className={styles.tooltipBubble}>Resets every Monday</div>
                            </div>
                        </div>

                        <div className={styles.leaderboardList}>
                            {weeklyLeaderboard.map((entry) => {
                                const initials = getInitials(entry.fullName);
                                const avatarBgClass = getAvatarColorClass(entry.userId, styles);

                                return (
                                    <div
                                        key={entry.userId}
                                        className={`${styles.leaderboardRow} ${entry.isCurrentUser ? styles.currentUserRow : ''}`}
                                    >
                                        {entry.isCurrentUser && <span className={styles.activePillIndicator} />}

                                        <div className={styles.rankMarkerCol}>
                                            {entry.rank === 1 ? (
                                                <div className={styles.rank1Badge}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.rank1Icon}>
                                                        <path d="M2 6l4 4 6-8 6 8 4-4-2 13H4L2 6z" />
                                                    </svg>
                                                </div>
                                            ) : entry.rank === 2 ? (
                                                <div className={styles.rank2Badge}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.rank2Icon}>
                                                        <circle cx="12" cy="15" r="6" />
                                                        <path d="M9 10L6 3M15 10l3-7" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className={styles.rankNumberText}>
                                                    #{entry.rank}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`${styles.userAvatarInitials} ${avatarBgClass}`}>
                                            {initials}
                                        </div>

                                        <div className={styles.userInfoCol}>
                                            <div className={styles.userNameRow}>
                                                <span className={styles.userNameText}>{entry.fullName}</span>
                                                {entry.isCurrentUser && <span className={styles.youTag}>(You)</span>}
                                            </div>
                                            {entry.currentStreak > 0 ? (
                                                <div className={styles.userStreakRow}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" className={styles.streakFlameSvg}>
                                                        <path
                                                            fill="currentColor"
                                                            d="M12 2c1 3-2 4-2 7a3 3 0 006 0c1.5 1.5 2 3.5 2 5a6 6 0 11-12 0c0-4 3-5 3-8 0-1.5.7-3 3-4z"
                                                        />
                                                    </svg>
                                                    <span>{entry.currentStreak}d streak</span>
                                                </div>
                                            ) : (
                                                <div className={styles.noStreakText}>No active streak</div>
                                            )}
                                        </div>

                                        <div className={styles.pointsPill}>
                                            {entry.weeklyPoints} <span className={styles.pointsLabel}>pts</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress Stats Table Card */}
                    <div className={styles.progressCard}>
                        <h3 className={styles.cardHeaderTitle} style={{ marginBottom: '16px' }}>Overall Progress</h3>
                        <div className={styles.progressStatsGrid}>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>
                                    <i className="fa-solid fa-dragon" style={{ color: 'var(--text-primary)', marginRight: '8px' }} aria-hidden="true" />
                                    Active Paths
                                </span>
                                <span className={styles.progressValue}>{totalPathsCount}</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>
                                    <i className="fa-solid fa-dragon" style={{ color: 'var(--tech-green)', marginRight: '8px' }} aria-hidden="true" />
                                    Completed Paths
                                </span>
                                <span className={styles.progressValue}>{completedPathsCount}</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>
                                    <i className="fa-solid fa-dove" style={{ color: 'var(--text-primary)', marginRight: '8px' }} aria-hidden="true" />
                                    Total Topics
                                </span>
                                <span className={styles.progressValue}>{totalTopicsCount}</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>
                                    <i className="fa-solid fa-dove" style={{ color: 'var(--tech-green)', marginRight: '8px' }} aria-hidden="true" />
                                    Completed Topics
                                </span>
                                <span className={styles.progressValue}>{completedTopicsCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
