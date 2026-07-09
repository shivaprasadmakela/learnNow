import React, { useState } from 'react';
import type { UserProfile, Course } from '../../../types';
import styles from './Dashboard.module.css';

interface DashboardProps {
    profile: UserProfile | null;
    courses?: Course[];
    activeTab?: 'activities' | 'paths';
    setActiveTab?: (tab: 'activities' | 'paths') => void;
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
    const {
        courses = [],
        activeTab: propActiveTab,
        setActiveTab: propSetActiveTab
    } = props;
    // Local state fallback if props are not supplied
    const [localActiveTab, localSetActiveTab] = useState<'activities' | 'paths'>('activities');
    const activeTab = propActiveTab || localActiveTab;
    const setActiveTab = propSetActiveTab || localSetActiveTab;

    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Streak weekday configuration
    const weekdays = [
        { name: 'Thu', completed: false, isDotted: false },
        { name: 'Fri', completed: true, isDotted: false }, // checked
        { name: 'Sat', completed: false, isDotted: true },  // dotted circles
        { name: 'Sun', completed: false, isDotted: true },
        { name: 'Mon', completed: false, isDotted: false },
        { name: 'Tue', completed: false, isDotted: false },
        { name: 'Wed', completed: false, isDotted: false }
    ];

    // Default categories row
    const defaultCategories = ['AI / ML', 'Agents', 'Data', 'Dev Tools', 'Infrastructure', 'Productivity', 'Security'];
    // Extract unique categories from backend paths
    const backendCategories = Array.from(new Set(courses.map(c => c.category))).filter(Boolean);
    // Combine uniquely
    const allCategories = ['All', ...Array.from(new Set([...defaultCategories, ...backendCategories]))];

    // Filter paths based on selected category
    const filteredPaths = courses.filter(course => {
        if (selectedCategory === 'All') return true;
        return course.category.toLowerCase() === selectedCategory.toLowerCase();
    });

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'AI / ML':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
                    </svg>
                );
            case 'Agents':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 3v4M3 5h4M19 17v4M17 19h4M12 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" />
                    </svg>
                );
            case 'Data':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M21 16H3M21 11H3M10 21V3" />
                    </svg>
                );
            case 'Dev Tools':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                );
            case 'Infrastructure':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="8" rx="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                    </svg>
                );
            case 'Productivity':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                );
            case 'Security':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                );
            case 'Backend':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
                    </svg>
                );
            case 'Frontend':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                );
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                );
        }
    };

    // Grab first course (Java) as current course
    const activeCourse = courses.length > 0 ? courses[0] : {
        title: "Java Backend Path",
        description: "Learn core Java programming, object-oriented design patterns, collections framework, multithreading, and Spring Boot enterprise APIs.",
        category: "Backend"
    };

    return (
        <div className={styles.container}>
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
                            <span className={styles.courseCardPreTitle}>{activeCourse.category} Path &gt;</span>
                            <h2 className={styles.courseCardTitle}>{activeCourse.title}</h2>
                            <p className={styles.courseCardDesc}>{activeCourse.description}</p>
                            <button className={styles.startButton} onClick={() => setActiveTab('activities')}>
                                <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                <span>Start</span>
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
                                {courses.map((act, index) => {
                                    const isFeatured = act.category === 'Backend' || act.id === 1;
                                    const displayTags = isFeatured ? ['Featured', 'Path'] : ['Path'];
                                    
                                    return (
                                        <div key={index} className={styles.previewCard}>
                                            <div className={styles.cardTags}>
                                                {displayTags.map((tag, tIdx) => {
                                                    let tagStyle = styles.tagPath;
                                                    if (tag.toLowerCase() === 'featured') {
                                                        tagStyle = styles.tagFeatured;
                                                    }
                                                    return (
                                                        <span key={tIdx} className={`${styles.cardTag} ${tagStyle}`}>
                                                            {tag}
                                                        </span>
                                                    );
                                                })}
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
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.pathsContainer}>
                                {/* Paths Catalog Header */}
                                <div className={styles.pathsBreadcrumb}>
                                    <span>Home</span>
                                    <span className={styles.breadcrumbDivider}>&gt;</span>
                                    <span className={styles.breadcrumbActive}>Paths</span>
                                </div>

                                <div className={styles.pathsHeader}>
                                    <h1 className={styles.pathsTitle}>Shape <span>your</span> future self</h1>
                                    <p className={styles.pathsSubtitle}>
                                        Paths are collections of learnings designed to build deep skills in a particular area. Whether you're looking to earn achievements, build a collection of skill badges, or prepare for a certification, there are paths right for you. When you're done, share your accomplishments on social media and hiring platforms like LinkedIn and Credly.
                                    </p>
                                </div>

                                {/* Category Filters Row */}
                                <div className={styles.categoriesRow}>
                                    {allCategories.map((cat, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`${styles.categoryItem} ${selectedCategory === cat ? styles.categoryItemActive : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            <div className={styles.categoryIcon}>
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <span className={styles.categoryLabel}>{cat}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Dynamic Cards Grid */}
                                <div className={styles.cardsGrid}>
                                    {filteredPaths.map((path, idx) => (
                                        <div key={idx} className={styles.previewCard}>
                                            <div className={styles.cardTags}>
                                                <span className={`${styles.cardTag} ${styles.tagPath}`}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '4px' }}>
                                                        <line x1="6" y1="3" x2="6" y2="15"></line>
                                                        <circle cx="18" cy="6" r="3"></circle>
                                                        <circle cx="6" cy="18" r="3"></circle>
                                                        <path d="M18 9a9 9 0 0 1-9 9"></path>
                                                    </svg>
                                                    Path
                                                </span>
                                            </div>
                                            <h3 className={styles.cardTitle}>{path.title}</h3>
                                            <p className={styles.cardDesc}>{path.description}</p>
                                            <div className={styles.cardFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {path.managedBy || 'Managed by Academy'}
                                                </span>
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
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Streak, Achievements & Progress Table */}
                <div className={styles.rightCol}>
                    {/* Weekly Streak Card */}
                    <div className={styles.streakCard}>
                        <div className={styles.streakInfo}>
                            <span className={styles.streakBigNumber}>0</span>
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
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                        <polygon points="12 2 22 10 12 18 2 10" fill="#ffedd5" />
                                        <path d="M12 6v8" stroke="#ea580c" />
                                    </svg>
                                </div>
                                <div className={styles.achievementMeta}>
                                    <span className={styles.achievementName}>10 Days</span>
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
