import React, { useState } from 'react';
import type { Course, CourseModule, UserProgress } from '../types';
import { Button } from '../../../shared/components/Button/Button';
import styles from './CourseDetail.module.css';

const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const ClockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const BarChartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tech-green)' }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const FolderIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tech-blue)' }}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

interface CourseDetailProps {
    course: Course | null;
    progress: UserProgress[];
    onBack: () => void;
    onStartLesson: (lessonId: number) => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
    course,
    progress,
    onBack,
    onStartLesson
}) => {
    const [activeModuleId, setActiveModuleId] = useState<number | null>(null);

    if (!course) {
        return (
            <div className={styles.loading}>
                <p>Loading course syllabus details...</p>
            </div>
        );
    }

    // Helper functions for progress
    const getModuleProgress = (mod: CourseModule) => {
        if (!mod.lessons || mod.lessons.length === 0) return { completed: 0, total: 0, percent: 0 };
        const completed = mod.lessons.filter(l => progress.some(p => p.lessonId === l.id && p.completed)).length;
        const total = mod.lessons.length;
        return {
            completed,
            total,
            percent: Math.round((completed / total) * 100)
        };
    };

    const isLessonCompleted = (lessonId: number): boolean => {
        return progress.some(p => p.lessonId === lessonId && p.completed);
    };

    // Find the currently active module if we are inside a sub-level
    const activeModule = course.modules?.find(m => m.id === activeModuleId);

    // If activeModuleId is set but doesn't exist, reset it
    if (activeModuleId !== null && !activeModule) {
        setActiveModuleId(null);
    }

    return (
        <div className={styles.container}>
            {/* Top Toolbar / Breadcrumbs */}
            <div className={styles.toolbar}>
                <div className={styles.breadcrumbs}>
                    <button className={styles.breadcrumbLink} onClick={onBack}>
                        Courses
                    </button>
                    <span className={styles.breadcrumbSeparator}>&gt;</span>
                    <button
                        className={`${styles.breadcrumbLink} ${activeModuleId === null ? styles.breadcrumbActive : ''}`}
                        onClick={() => setActiveModuleId(null)}
                    >
                        {course.title}
                    </button>
                    {activeModule && (
                        <>
                            <span className={styles.breadcrumbSeparator}>&gt;</span>
                            <span className={styles.breadcrumbActive}>{activeModule.title}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Course Header Banner */}
            <div className={styles.heroBanner}>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>{course.category} Pathway</div>
                    <h1 className={styles.title}>
                        {activeModule ? activeModule.title : course.title}
                    </h1>
                    <p className={styles.desc}>
                        {activeModule
                            ? `Master all topics in ${activeModule.title} to complete this level of the ${course.title}.`
                            : course.description
                        }
                    </p>

                    <div className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                            <ClockIcon />
                            <span>Duration: <strong>{course.duration}</strong></span>
                        </div>
                        <div className={styles.metaItem}>
                            <BarChartIcon />
                            <span>Level: <strong>{course.level}</strong></span>
                        </div>
                    </div>

                    {activeModuleId !== null && (
                        <div className={styles.actions}>
                            <Button
                                variant="secondary"
                                onClick={() => setActiveModuleId(null)}
                            >
                                <BackIcon />
                                <span>Back to Levels</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Syllabus Grid */}
            <main className={styles.mainLayout}>
                {activeModuleId === null ? (
                    // LEVEL 1: RENDER LEVELS (MODULES) AS CARDS
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Course Levels & Sections</h2>
                        <p className={styles.sectionSubtitle}>
                            Select a level to view its topics and start learning.
                        </p>

                        <div className={styles.cardsGrid}>
                            {course.modules?.map((mod, idx) => {
                                const { total, percent } = getModuleProgress(mod);
                                return (
                                    <div
                                        key={mod.id}
                                        className={styles.levelCard}
                                        onClick={() => setActiveModuleId(mod.id)}
                                    >
                                        <div className={styles.cardHeader}>
                                            <span className={styles.cardIndex}>Level {idx + 1}</span>
                                            <FolderIcon />
                                        </div>
                                        <h3 className={styles.cardTitle}>{mod.title}</h3>
                                        <p className={styles.cardDescription}>
                                            Learn core topics and build your skillset in this section.
                                        </p>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.cardMeta}>{total} Topics</span>
                                            <div className={styles.cardProgressWrapper}>
                                                <div className={styles.cardProgressBar}>
                                                    <div
                                                        className={styles.cardProgressFill}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <span className={styles.cardProgressText}>{percent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    // LEVEL 2: RENDER TOPICS (LESSONS) AS CARDS inside selected level
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Topics in this Level</h2>
                        <p className={styles.sectionSubtitle}>
                            Select a topic below to read, practice in the sandbox, and verify your knowledge.
                        </p>

                        <div className={styles.cardsGrid}>
                            {activeModule?.lessons?.map((les, idx) => {
                                const completed = isLessonCompleted(les.id);
                                return (
                                    <div
                                        key={les.id}
                                        className={styles.topicCard}
                                        onClick={() => onStartLesson(les.id)}
                                    >
                                        <div className={styles.cardHeader}>
                                            <span className={styles.cardIndex}>Topic {idx + 1}</span>
                                            {completed ? <CheckCircleIcon /> : <PlayIcon />}
                                        </div>
                                        <h3 className={styles.cardTitle}>{les.title}</h3>
                                        <p className={styles.cardDescription}>
                                            {les.content
                                                ? les.content.replace(/[#*`\-+]/g, '').substring(0, 120) + '...'
                                                : "Read instructions, play in the sandbox, and take the check quiz."
                                            }
                                        </p>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.cardMeta}>{les.durationMinutes} mins read</span>
                                            <button className={styles.cardStartBtn}>
                                                {completed ? "Review" : "Start"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default CourseDetail;
