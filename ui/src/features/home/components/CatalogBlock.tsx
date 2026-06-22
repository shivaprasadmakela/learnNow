import React from 'react';
import type { Course } from '../../../features/learning/types';
import { Button } from '../../../shared/components/Button/Button';
import { BookOpenIcon, LockIcon, RightArrowIcon, SearchIcon } from '../../../shared/components/Icons';
import styles from './Home.module.css';

interface CatalogBlockProps {
    filteredCourses: Course[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    getCourseProgress: (courseId: number) => number;
    onSelectCourse: (courseId: number) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
}

export const CatalogBlock: React.FC<CatalogBlockProps> = ({
    filteredCourses,
    activeTab,
    setActiveTab,
    getCourseProgress,
    onSelectCourse,
    searchQuery,
    setSearchQuery
}) => {
    return (
        <section id="catalog-section" className={styles.darkBlockContainer}>
            <div className={styles.darkBlock}>
                {/* Tab row */}
                <div className={styles.darkBlockSubtitle}>
                    {['Featured', 'Fullstack', 'Backend', 'Cloud', 'Design'].map(tab => (
                        <span
                            key={tab}
                            className={`${styles.darkTab} ${activeTab === tab ? styles.darkTabActive : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </span>
                    ))}
                </div>

                {/* Heading */}
                <div className={styles.darkBlockHeader}>
                    <h2 className={styles.darkBlockTitle}>Skill up on development today</h2>
                    <p className={styles.darkBlockDesc}>
                        Software engineering is constantly changing. Learn backend architectures,
                        frontend hooks, and API integrations with hands-on practice.
                    </p>
                </div>

                {/* Mobile Search Input */}
                <div className={styles.mobileSearchContainer}>
                    <SearchIcon size={18} className={styles.mobileSearchIcon} />
                    <input
                        type="text"
                        className={styles.mobileSearchInput}
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Course cards */}
                <div className={styles.coursesGrid}>
                    {filteredCourses.map(course => {
                        const progressVal = getCourseProgress(course.id);
                        const isLocked = course.id !== 1;
                        return (
                            <div
                                key={course.id}
                                className={styles.courseCard}
                                onClick={() => isLocked ? null : onSelectCourse(course.id)}
                            >
                                <div className={styles.cardBadge}>
                                    <BookOpenIcon size={14} />
                                    <span>{course.category} {isLocked ? '(Coming Soon)' : 'Path'}</span>
                                </div>
                                <h3 className={styles.cardTitle}>{course.title}</h3>
                                <p className={styles.cardDesc}>{course.description}</p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.cardStats}>
                                        <span>Duration: <strong>{course.duration}</strong></span>
                                        <span>Level: <strong>{course.level}</strong></span>
                                        {!isLocked && progressVal > 0 && (
                                            <div style={{ marginTop: '8px' }}>
                                                <span style={{ display: 'block', marginBottom: '4px' }}>Progress: {progressVal}%</span>
                                                <div className={styles.cardProgressBarContainer}>
                                                    <div className={styles.cardProgressBar} style={{ width: `${progressVal}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {isLocked ? (
                                        <div className={styles.arrowBtn} style={{ opacity: 0.5, cursor: 'default' }}>
                                            <LockIcon size={18} />
                                        </div>
                                    ) : (
                                        <button
                                            className={styles.arrowBtn}
                                            onClick={e => { e.stopPropagation(); onSelectCourse(course.id); }}
                                        >
                                            <RightArrowIcon size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Explore catalog CTA */}
                <div className={styles.darkBlockCta}>
                    <Button variant="secondary" onClick={() => setActiveTab('Featured')}>
                        Explore catalog
                    </Button>
                </div>
            </div>
        </section>
    );
};
export default CatalogBlock;
