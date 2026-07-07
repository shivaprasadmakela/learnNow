import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../../types';
import { Button } from '../../../shared/components/Button/Button';
import { Input } from '../../../shared/components/Input/Input';
import styles from './Dashboard.module.css';

interface DashboardProps {
    profile: UserProfile | null;
    onSaveProfile: (fullName: string, avatar: string, role: string, bio: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    profile,
    onSaveProfile
}) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [fullName, setFullName] = useState<string>(profile?.fullName || 'Alex Learner');
    const [avatar, setAvatar] = useState<string>(profile?.avatar || '👨‍💻');
    const [role, setRole] = useState<string>(profile?.role || 'Junior Fullstack Engineer');
    const [bio, setBio] = useState<string>(profile?.bio || 'Learning React & Spring Boot.');
    const [activeTab, setActiveTab] = useState<'activities' | 'paths'>('activities');

    // Sync state with profile loaded from API
    useEffect(() => {
        if (profile) {
            /* eslint-disable react-hooks/set-state-in-effect */
            setFullName(profile.fullName);
            setAvatar(profile.avatar);
            setRole(profile.role);
            setBio(profile.bio);
            /* eslint-enable react-hooks/set-state-in-effect */
        }
    }, [profile]);

    const handleSave = () => {
        onSaveProfile(fullName, avatar, role, bio);
        setIsEditing(false);
    };

    // Streak weekday configuration
    const weekdays = [
        { name: 'Tue', completed: false, isDotted: false },
        { name: 'Wed', completed: false, isDotted: false },
        { name: 'Thu', completed: false, isDotted: false },
        { name: 'Fri', completed: true, isDotted: false }, // checked as shown in mock
        { name: 'Sat', completed: false, isDotted: true },  // dotted circles
        { name: 'Sun', completed: false, isDotted: true },
        { name: 'Mon', completed: false, isDotted: false }
    ];

    // Static mock data for activities to match Google Skills layout
    const activities = [
        {
            title: "Integrate Generative AI Into Your Data Workflow",
            description: "This learning path is for data professionals who want to integrate generative AI tools and LLMs into their data engineering pipelines.",
            tags: ["Featured", "Path"]
        },
        {
            title: "Deploy and Manage Generative AI Models",
            description: "This learning path provides a comprehensive introduction to machine learning operations (MLOps) for generative AI models on Google Cloud.",
            tags: ["Featured", "Path"]
        },
        {
            title: "Build and Modernize Applications With Generative AI",
            description: "This learning path is for application developers who want to enhance their projects with cutting edge generative AI capabilities and modern frameworks.",
            tags: ["Featured", "Path"]
        }
    ];

    return (
        <div className={styles.container}>
            {/* Profile editing overlay sheet */}
            {isEditing && (
                <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <Button variant="primary" onClick={handleSave}>
                                Save Changes
                            </Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Welcome Banner & Top Navigation */}
            <div className={styles.welcomeHeader}>
                <div className={styles.welcomeLeft}>
                    <span className={styles.avatarCircle}>{avatar}</span>
                    <div>
                        <h1 className={styles.welcomeTitle}>Welcome back, {fullName}!</h1>
                        <p className={styles.welcomeSubtitle}>{role} · {bio}</p>
                    </div>
                </div>
                <div className={styles.welcomeRight}>
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                </div>
            </div>

            {/* Main Google Skills Dashboard Grid */}
            <div className={styles.dashboardGrid}>
                {/* Left Column: Course Card, Tabs & Grid Cards */}
                <div className={styles.leftCol}>
                    {/* Current Course Card */}
                    <div className={styles.currentCourseCard}>
                        <div className={styles.courseCardLeft}>
                            <div className={styles.courseCardIllustration}>
                                <svg width="100%" height="100%" viewBox="0 0 200 120" fill="none">
                                    <rect width="200" height="120" rx="8" fill="#e8f0fe" />
                                    {/* Monitor Shape */}
                                    <rect x="40" y="20" width="120" height="70" rx="4" fill="#ffffff" stroke="#1a73e8" strokeWidth="2" />
                                    <line x1="100" y1="90" x2="100" y2="105" stroke="#1a73e8" strokeWidth="3" />
                                    <line x1="80" y1="105" x2="120" y2="105" stroke="#1a73e8" strokeWidth="3" />
                                    {/* Inside Screen Content */}
                                    <rect x="50" y="30" width="30" height="50" fill="#adcbfa" rx="2" />
                                    <rect x="90" y="30" width="60" height="8" fill="#1a73e8" rx="1" />
                                    <rect x="90" y="44" width="50" height="6" fill="#dadce0" rx="1" />
                                    <rect x="90" y="56" width="40" height="6" fill="#dadce0" rx="1" />
                                    <rect x="90" y="68" width="55" height="6" fill="#dadce0" rx="1" />
                                </svg>
                            </div>
                        </div>
                        <div className={styles.courseCardRight}>
                            <span className={styles.courseCardPreTitle}>Stay Tuned! &gt; Active Course Preview</span>
                            <h2 className={styles.courseCardTitle}>Your active course will appear here.</h2>
                            <p className={styles.courseCardDesc}>Explore activities and choose a learning path below to begin tracking your skills progress.</p>
                            <button className={styles.startButton} onClick={() => setActiveTab('activities')}>
                                <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                <span>Browse Courses</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className={styles.tabContainer}>
                        <button
                            className={`${styles.tabLink} ${activeTab === 'activities' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('activities')}
                        >
                            Activities
                        </button>
                        <button
                            className={`${styles.tabLink} ${activeTab === 'paths' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('paths')}
                        >
                            Paths
                        </button>
                    </div>

                    {/* Tab Content Panels */}
                    <div className={styles.tabContent}>
                        {activeTab === 'activities' ? (
                            <div className={styles.cardsGrid}>
                                {activities.map((act, index) => (
                                    <div key={index} className={styles.previewCard}>
                                        <div className={styles.cardTags}>
                                            {act.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className={styles.cardTag}>
                                                    {tag === 'Featured' ? '✨ ' : '💻 '}
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h3 className={styles.cardTitle}>{act.title}</h3>
                                        <p className={styles.cardDesc}>{act.description}</p>
                                        <div className={styles.cardFooter}>
                                            <button className={styles.circleArrowBtn} title="Explore Path">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    <polyline points="12 5 19 12 12 19"></polyline>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.comingSoonPanel}>
                                <div className={styles.comingSoonIcon}>🗺️</div>
                                <h3>Paths Under Construction</h3>
                                <p>We are actively building learning tracks. Check back soon for hand-on practice sandboxes and certification verification!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Streak, Achievements & Progress Table */}
                <div className={styles.rightCol}>
                    {/* Weekly Streak Card */}
                    <div className={styles.streakCard}>
                        <div className={styles.streakInfo}>
                            <span className={styles.streakBigNumber}>1</span>
                            <div className={styles.streakLabelContainer}>
                                <svg className={styles.streakFlameIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2S6 7 6 12s4 8 6 8 6-3 6-8-6-10-6-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                                </svg>
                                <span className={styles.streakSubLabel}>Current streak</span>
                            </div>
                        </div>

                        <div className={styles.weekCalendar}>
                            {weekdays.map((day, idx) => (
                                <div key={idx} className={styles.calendarDay}>
                                    <div className={`${styles.dayIndicatorCircle} ${day.completed ? styles.dayCircleActive : ''} ${day.isDotted ? styles.dayCircleDotted : ''}`}>
                                        {day.completed ? (
                                            <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                            </svg>
                                        ) : null}
                                    </div>
                                    <span className={styles.calendarDayLabel}>{day.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements Card */}
                    <div className={styles.achievementsCard}>
                        <div className={styles.cardHeaderWithAction}>
                            <h3 className={styles.cardHeaderTitle}>Achievements</h3>
                            <button className={styles.expandIconBtn} title="Expand">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.achievementsStack}>
                            {/* Achievement 1 */}
                            <div className={styles.achievementItem}>
                                <div className={styles.achievementIconWrapper} style={{ backgroundColor: '#fffbeb' }}>
                                    {/* Yellow diamond Shield */}
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                                        <polygon points="12 2 22 12 12 22 2 12" fill="#fef08a" />
                                        <circle cx="12" cy="12" r="3" fill="#ca8a04" />
                                    </svg>
                                </div>
                                <div className={styles.achievementMeta}>
                                    <span className={styles.achievementName}>5 Courses</span>
                                    <div className={styles.progressBarBg}>
                                        <div className={styles.progressBarFill} style={{ width: '40%', backgroundColor: '#eab308' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Achievement 2 */}
                            <div className={styles.achievementItem}>
                                <div className={styles.achievementIconWrapper} style={{ backgroundColor: '#fff7ed' }}>
                                    {/* Orange Shield */}
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                        <polygon points="12 2 22 10 12 18 2 10" fill="#ffedd5" />
                                        <path d="M12 6v8" stroke="#ea580c" />
                                    </svg>
                                </div>
                                <div className={styles.achievementMeta}>
                                    <span className={styles.achievementName}>10 Days Streak</span>
                                    <div className={styles.progressBarBg}>
                                        <div className={styles.progressBarFill} style={{ width: '10%', backgroundColor: '#f97316' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Stats Table Card */}
                    <div className={styles.progressCard}>
                        <h3 className={styles.cardHeaderTitle} style={{ marginBottom: '16px' }}>Progress</h3>
                        <div className={styles.progressStatsGrid}>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>🎓 Course</span>
                                <span className={styles.progressValue}>2</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>🔬 Lab</span>
                                <span className={styles.progressValue}>0</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>✅ Check</span>
                                <span className={styles.progressValue}>6</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>📖 Lesson</span>
                                <span className={styles.progressValue}>1</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>🏫 Classroom</span>
                                <span className={styles.progressValue}>0</span>
                            </div>
                            <div className={styles.progressRow}>
                                <span className={styles.progressLabel}>🗺️ Path</span>
                                <span className={styles.progressValue}>0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
