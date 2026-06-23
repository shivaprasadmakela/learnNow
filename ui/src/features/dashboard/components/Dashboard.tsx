import React, { useState, useEffect } from 'react';
import type { Course, UserProgress, UserProfile } from '../../../features/learning/types';
import { Button } from '../../../shared/components/Button/Button';
import { Input } from '../../../shared/components/Input/Input';
import styles from './Dashboard.module.css';

// SVG Icons helpers
const PlayIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="6 3 20 12 6 21 6 3"></polygon>
    </svg>
);

const FlameIcon = ({ size = 20, active = false }: { size?: number; active?: boolean }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill={active ? "url(#flameGrad)" : "none"} 
        stroke={active ? "#ea580c" : "var(--text-tertiary)"} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ filter: active ? 'drop-shadow(0 2px 6px rgba(234, 88, 12, 0.4))' : 'none' }}
    >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
        {active && (
            <defs>
                <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
            </defs>
        )}
    </svg>
);

const ArrowIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const MaximizeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
);

// SVG Icons helpers

interface DashboardProps {
    courses: Course[];
    progress: UserProgress[];
    profile: UserProfile | null;
    onBack: () => void;
    onResetProgress: () => void;
    onSelectCourse: (id: number) => void;
    onSelectLesson: (id: number) => void;
    onSaveProfile: (fullName: string, avatar: string, role: string, bio: string) => void;
    onChangeView: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    courses,
    progress,
    profile,
    onBack: _onBack,
    onResetProgress,
    onSelectCourse,
    onSelectLesson,
    onSaveProfile,
    onChangeView
}) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [fullName, setFullName] = useState<string>(profile?.fullName || 'Alex Learner');
    const [avatar, setAvatar] = useState<string>(profile?.avatar || '👨‍💻');
    const [role, setRole] = useState<string>(profile?.role || 'Junior Fullstack Engineer');
    const [bio, setBio] = useState<string>(profile?.bio || 'Learning React & Spring Boot.');
    const [activeTab, setActiveTab] = useState<'activities' | 'paths'>('activities');
    const [claimStatus, setClaimStatus] = useState<'unclaimed' | 'claiming' | 'claimed'>('unclaimed');

    // Sync state with profile loaded from API
    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName);
            setAvatar(profile.avatar);
            setRole(profile.role);
            setBio(profile.bio);
        }
    }, [profile]);

    const completedCount = progress.filter(p => p.completed).length;
    const progressVal = Math.min(Math.round((completedCount / 8) * 100), 100); // course 1 has 8 lessons

    // Find active learning lesson
    const activeCourse = courses.find(c => c.id === 1);
    let nextLesson: any = null;
    let pathBreadcrumb = "Shiva Paths > Fullstack Development";
    let activeLessonTitle = "All completed! Check your portal.";
    
    if (activeCourse && activeCourse.modules) {
        const allLessons = activeCourse.modules.flatMap(m => m.lessons || []);
        const uncompleted = allLessons.find(l => !progress.some(p => p.lessonId === l.id && p.completed));
        if (uncompleted) {
            nextLesson = uncompleted;
            const parentModule = activeCourse.modules.find(m => m.lessons.some(l => l.id === uncompleted.id));
            pathBreadcrumb = `React & Spring Boot > ${parentModule?.title || 'Fullstack Development'}`;
            activeLessonTitle = uncompleted.title;
        } else {
            pathBreadcrumb = `React & Spring Boot > Course Completed`;
            activeLessonTitle = "Congratulations! Claim your Certificate";
        }
    }

    const handleResume = () => {
        if (nextLesson) {
            onSelectLesson(nextLesson.id);
        } else {
            onChangeView('CERTIFICATE');
        }
    };

    const handleSave = () => {
        onSaveProfile(fullName, avatar, role, bio);
        setIsEditing(false);
    };

    // Calculate last 7 days of user activity
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7Days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        last7Days.push(d);
    }

    const hasCompletionOnDay = (date: Date) => {
        const dateStr = date.toDateString();
        return progress.some(p => {
            if (!p.completed || !p.completedAt) return false;
            const completedDate = new Date(p.completedAt);
            return completedDate.toDateString() === dateStr;
        });
    };

    // Calculate Streak consecutive days completed
    let calculatedStreak = 0;
    const checkDate = new Date(today);
    let active = hasCompletionOnDay(checkDate);
    if (active) {
        calculatedStreak = 1;
        while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            if (hasCompletionOnDay(checkDate)) {
                calculatedStreak++;
            } else {
                break;
            }
        }
    } else {
        checkDate.setDate(checkDate.getDate() - 1);
        if (hasCompletionOnDay(checkDate)) {
            calculatedStreak = 1;
            while (true) {
                checkDate.setDate(checkDate.getDate() - 1);
                if (hasCompletionOnDay(checkDate)) {
                    calculatedStreak++;
                } else {
                    break;
                }
            }
        }
    }
    const currentStreak = calculatedStreak || (completedCount > 0 ? 1 : 0);

    const handleClaim = () => {
        setClaimStatus('claiming');
        setTimeout(() => {
            setClaimStatus('claimed');
        }, 800);
    };

    return (
        <div className={styles.container}>
            <main className={styles.mainLayout}>
                {/* Profile collapsable settings block */}
                {isEditing ? (
                    <section className={styles.profileEditSection}>
                        <div className={styles.profileForm}>
                            <h3 className={styles.formTitle}>Edit Profile Settings</h3>
                            <div className={styles.formRow}>
                                <Input 
                                    label="Avatar (Emoji)" 
                                    value={avatar} 
                                    onChange={(e) => setAvatar(e.target.value)} 
                                />
                                <Input 
                                    label="Full Name (Printed on Certificate)" 
                                    value={fullName} 
                                    onChange={(e) => setFullName(e.target.value)} 
                                />
                            </div>
                            <Input 
                                label="Current Role" 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)} 
                            />
                            <div className={styles.textareaContainer}>
                                <label className={styles.textareaLabel}>Bio</label>
                                <textarea 
                                    className={styles.textarea}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <Button variant="primary" onClick={handleSave}>
                                    Save Changes
                                </Button>
                                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <div className={styles.welcomeHeader}>
                        <div>
                            <h1 className={styles.welcomeTitle}>Welcome back, {fullName}!</h1>
                            <p className={styles.welcomeSubtitle}>{role} · {avatar}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                            Edit Settings
                        </Button>
                    </div>
                )}

                {/* Dashboard Two-Column Grid */}
                <div className={styles.dashboardGrid}>
                    
                    {/* LEFT COLUMN: Main workbench */}
                    <div className={styles.leftCol}>
                        {/* Active Learning Hero Card */}
                        <div className={styles.heroCard}>
                            <div className={styles.heroLeft}>
                                <span className={styles.heroBreadcrumb}>{pathBreadcrumb}</span>
                                <h2 className={styles.heroTitle}>{activeLessonTitle}</h2>
                                <button className={styles.heroStartBtn} onClick={handleResume}>
                                    <PlayIcon />
                                    <span>{completedCount === 0 ? "Start" : nextLesson ? "Start" : "View"}</span>
                                </button>
                            </div>
                            <div className={styles.heroRight}>
                                {/* Custom Inline SVG computer workspace illustration */}
                                <svg width="220" height="150" viewBox="0 0 240 180" className={styles.illustration}>
                                    {/* Table line */}
                                    <line x1="20" y1="160" x2="220" y2="160" stroke="var(--border-color)" strokeWidth="3" strokeLinecap="round" />
                                    
                                    {/* Computer Screen Stand */}
                                    <path d="M100 135 L140 135 L130 160 L110 160 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="2.5" />
                                    
                                    {/* Main Display Monitor */}
                                    <rect x="50" y="30" width="140" height="105" rx="8" ry="8" fill="var(--bg-primary)" stroke="var(--border-color)" strokeWidth="3" />
                                    
                                    {/* Floating window inside screen */}
                                    <rect x="65" y="45" width="80" height="50" rx="3" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1.5" />
                                    <circle cx="73" cy="53" r="2" fill="var(--tech-red)" />
                                    <circle cx="80" cy="53" r="2" fill="var(--tech-yellow)" />
                                    <circle cx="87" cy="53" r="2" fill="var(--tech-green)" />
                                    
                                    {/* Code lines */}
                                    <line x1="73" y1="65" x2="135" y2="65" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="73" y1="72" x2="120" y2="72" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="73" y1="79" x2="110" y2="79" stroke="var(--tech-blue)" strokeWidth="2" strokeLinecap="round" />
                                    
                                    {/* Smaller side browser cards overlay */}
                                    <rect x="125" y="65" width="75" height="60" rx="4" fill="var(--bg-primary)" stroke="var(--tech-blue)" strokeWidth="2" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }} />
                                    <circle cx="132" cy="72" r="2" fill="var(--tech-blue)" />
                                    <line x1="138" y1="72" x2="175" y2="72" stroke="var(--border-color)" strokeWidth="1.5" />
                                    <rect x="132" y="80" width="60" height="32" rx="2" fill="var(--accent-blue-light)" />
                                    
                                    {/* Hand Cursor Click Pointer */}
                                    <path d="M115 88 L123 93 L120 102 L115 97 Z" fill="var(--text-primary)" />
                                    
                                    {/* Plant Pot decoration */}
                                    <path d="M25 125 L35 125 L32 160 L28 160 Z" fill="var(--border-color)" />
                                    <path d="M30 105 C20 115 25 125 30 125 C35 125 40 115 30 105" fill="var(--tech-green)" opacity="0.8" />
                                    <path d="M22 110 C15 120 22 125 28 125" fill="var(--tech-green)" opacity="0.9" />
                                </svg>
                            </div>
                        </div>

                        {/* Activities & Paths Navigation tabs */}
                        <div className={styles.tabsContainer}>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'activities' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('activities')}
                            >
                                Activities
                            </button>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'paths' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('paths')}
                            >
                                Paths
                            </button>
                        </div>

                        {/* Tab contents */}
                        {activeTab === 'activities' ? (
                            <div className={styles.activitiesGrid}>
                                <div className={styles.activityCard}>
                                    <div className={styles.activityBadgeRow}>
                                        <span className={styles.activityBadgeFeatured}>Featured</span>
                                        <span className={styles.activityBadgePath}>Path</span>
                                    </div>
                                    <h3 className={styles.activityTitle}>Integrate Spring REST Controllers</h3>
                                    <p className={styles.activityDesc}>Learn backend API configurations, controller mappings, response bodies, and parameter bindings in Java.</p>
                                    <button className={styles.activityArrowBtn} onClick={() => onSelectCourse(1)}>
                                        <ArrowIcon />
                                    </button>
                                </div>
                                <div className={styles.activityCard}>
                                    <div className={styles.activityBadgeRow}>
                                        <span className={styles.activityBadgeFeatured}>Featured</span>
                                        <span className={styles.activityBadgePath}>Path</span>
                                    </div>
                                    <h3 className={styles.activityTitle}>React State and Hook Lifecycle</h3>
                                    <p className={styles.activityDesc}>Master client-side state hooks, rendering properties, context integrations, and frontend components development.</p>
                                    <button className={styles.activityArrowBtn} onClick={() => onSelectCourse(1)}>
                                        <ArrowIcon />
                                    </button>
                                </div>
                                <div className={styles.activityCard}>
                                    <div className={styles.activityBadgeRow}>
                                        <span className={styles.activityBadgeFeatured}>Featured</span>
                                        <span className={styles.activityBadgePath}>Path</span>
                                    </div>
                                    <h3 className={styles.activityTitle}>Deploy Fullstack Apps to Cloud</h3>
                                    <p className={styles.activityDesc}>Explore container packaging, environment properties configuration, Spring profiles, and CORS security headers.</p>
                                    <button className={styles.activityArrowBtn} onClick={() => onSelectCourse(1)}>
                                        <ArrowIcon />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.pathsList}>
                                <div className={styles.pathwayCard}>
                                    <div className={styles.pathwayLeft}>
                                        <span style={{ fontSize: '2rem' }}>🎓</span>
                                        <div>
                                            <h4 className={styles.pathwayCardTitle}>React & Spring Boot Fullstack Development</h4>
                                            <span className={styles.pathwayMeta}>Syllabus Chapters: 4 Modules, 8 Lessons</span>
                                        </div>
                                    </div>
                                    <div className={styles.pathwayRight}>
                                        <div className={styles.progressBlock}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                                                <span>Path completion</span>
                                                <span>{progressVal}%</span>
                                            </div>
                                            <div className={styles.progressLineOuter}>
                                                <div className={styles.progressLineInner} style={{ width: `${progressVal}%` }}></div>
                                            </div>
                                        </div>
                                        <Button variant="primary" size="sm" onClick={handleResume}>
                                            {progressVal === 0 ? "Start Path" : progressVal === 100 ? "Review Path" : "Resume Path"}
                                        </Button>
                                    </div>
                                </div>

                                <div className={styles.pathwayCardLocked}>
                                    <div className={styles.pathwayLeft}>
                                        <span style={{ fontSize: '2rem' }}>🔒</span>
                                        <div>
                                            <h4 className={styles.pathwayCardTitle}>Secure API Design & Spring Security (Coming Soon)</h4>
                                            <span className={styles.pathwayMeta}>Core Modules: 3 Modules, 6 Lessons</span>
                                        </div>
                                    </div>
                                    <Button variant="secondary" size="sm" disabled>
                                        Locked
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Streak, Achievements */}
                    <div className={styles.rightCol}>
                        {/* Weekly Streak Card */}
                        <div className={styles.streakCard}>
                            <div className={styles.streakCardHeader}>
                                <span className={styles.streakNumber}>{currentStreak}</span>
                                <div className={styles.streakSub}>
                                    <FlameIcon size={16} active={currentStreak > 0} />
                                    <span>Current streak</span>
                                </div>
                            </div>
                            
                            <div className={styles.daysRow}>
                                {last7Days.map((day, idx) => {
                                    const isCompleted = hasCompletionOnDay(day);
                                    const isToday = day.toDateString() === today.toDateString();
                                    const dayName = daysOfWeek[day.getDay()];
                                    
                                    return (
                                        <div key={idx} className={styles.dayCol}>
                                            <div className={`${styles.dayIndicator} ${isCompleted ? styles.dayIndicatorActive : ''} ${isToday ? styles.dayIndicatorToday : ''}`}>
                                                {isCompleted ? (
                                                    <FlameIcon size={18} active={true} />
                                                ) : (
                                                    <div className={styles.dayDot} />
                                                )}
                                            </div>
                                            <span className={styles.dayLabel}>{dayName}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Achievements Collection Card */}
                        <div className={styles.achievementsCard}>
                            <div className={styles.achievementsHeader}>
                                <h3>Achievements</h3>
                                <button className={styles.headerIconBtn} title="View Achievements">
                                    <MaximizeIcon />
                                </button>
                            </div>

                            <div className={styles.badgesStack}>
                                {/* Achievement 1 */}
                                <div className={styles.badgeItem}>
                                    {/* Green shield shape */}
                                    <div className={styles.badgeGraphicShield}>
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#bbf7d0" />
                                            <path d="M2 17l10 5 10-5" />
                                            <path d="M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <span className={styles.badgeName}>Path enroll</span>
                                    {claimStatus === 'claimed' ? (
                                        <span className={styles.claimedLabel}>✓ Claimed</span>
                                    ) : (
                                        <button 
                                            className={styles.claimBtn} 
                                            onClick={handleClaim}
                                            disabled={claimStatus === 'claiming'}
                                        >
                                            {claimStatus === 'claiming' ? "..." : "Claim"}
                                        </button>
                                    )}
                                </div>

                                {/* Achievement 2 */}
                                <div className={styles.badgeItem}>
                                    {/* Yellow diamond shape */}
                                    <div className={styles.badgeGraphicDiamond}>
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                                            <polygon points="12 2 22 12 12 22 2 12" fill="#fef08a" />
                                            <circle cx="12" cy="12" r="3" fill="#ca8a04" />
                                        </svg>
                                    </div>
                                    <span className={styles.badgeName}>5 Courses</span>
                                    <div className={styles.badgeProgressContainer}>
                                        <div className={styles.badgeProgressBar} style={{ width: '20%' }} />
                                    </div>
                                </div>

                                {/* Achievement 3 */}
                                <div className={styles.badgeItem}>
                                    {/* Orange diamond shape */}
                                    <div className={styles.badgeGraphicOrange}>
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                            <polygon points="12 2 22 12 12 22 2 12" fill="#ffedd5" />
                                            <path d="M12 8v8M8 12h8" stroke="#ea580c" />
                                        </svg>
                                    </div>
                                    <span className={styles.badgeName}>10 Days</span>
                                    <div className={styles.badgeProgressContainer}>
                                        <div className={styles.badgeProgressBar} style={{ width: `${Math.min(currentStreak * 10, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reset Utilities Zone */}
                        <section className={styles.dangerZone}>
                            <h3 className={styles.dangerZoneTitle}>Testing utility</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                Clear completions to test sandbox play and calendar streaks:
                            </p>
                            <Button variant="danger" size="sm" onClick={() => {
                                if (window.confirm("Are you sure you want to reset all your progress data? This cannot be undone.")) {
                                    onResetProgress();
                                }
                            }}>
                                Reset completions
                            </Button>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
};
export default Dashboard;
