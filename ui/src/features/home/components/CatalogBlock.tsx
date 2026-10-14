import React, { useState } from 'react';
import { BookOpen, Layers, Clock, ArrowUpRight, ChevronDown, Check } from 'lucide-react';
import { Tabs } from '../../../shared/components';
import type { TabItem } from '../../../shared/components/ui/Tabs';
import type { Course } from '../../../types';
import { categoriesForFilter } from '../../../shared/utils/pathCategories';
import { formatStudyTime } from '../../../shared/utils/studyTime';
import styles from '../styles/Home.module.css';

interface CatalogBlockProps {
    /** The published paths, as loaded for the rest of the app. */
    courses: Course[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onSelectCourse: (courseId: number) => void;
}

/** How many of a path's topic titles the "what's inside" list shows. */
const SYLLABUS_LENGTH = 5;

/*
 * The real published paths. This block used to show three invented courses - "Fullstack React 19
 * & TypeScript Architecture" among them - with made-up durations, levels and syllabuses, under
 * categories no real path used. The study time is the sum of the path's authored lesson minutes;
 * there is no level, since every path runs from beginner lessons to advanced ones.
 */
export const CatalogBlock: React.FC<CatalogBlockProps> = ({
    courses,
    activeTab,
    setActiveTab,
    onSelectCourse
}) => {
    /*
     * Which card has its syllabus open. One at a time — the cards sit in a grid row, and two open
     * at once pushes the row's height around for a card nobody asked about.
     */
    const [openPathId, setOpenPathId] = useState<number | null>(null);

    const categories = ['All', ...categoriesForFilter(courses.map(course => course.category))];

    const pathsFor = (tab: string) =>
        tab === 'All' ? courses : courses.filter(course => course.category === tab);

    /*
     * The shared tab bar rather than a hand-rolled pill row: it brings arrow-key navigation and
     * a single tab stop for the group, which the original buttons did not have. The counts are
     * new — knowing a filter holds one path before clicking it is the difference between
     * exploring and guessing.
     */
    const tabItems: TabItem[] = categories.map(category => ({
        id: category,
        label: category,
        count: pathsFor(category).length
    }));

    // A tab can outlive its category - the paths may reload without it - so fall back to All.
    const shownTab = categories.includes(activeTab) ? activeTab : 'All';
    const displayedPaths = pathsFor(shownTab);

    // No published paths yet: an empty grid under "Curated Learning Paths" helps nobody.
    if (courses.length === 0) return null;

    return (
        <section id="catalog-section" className={styles.catalogSection}>
            <div className={styles.catalogHeader}>
                <div className={styles.sectionBadge}>
                    <BookOpen size={14} /> Curated Learning Paths
                </div>
                <h2 className={styles.catalogTitle}>Engineered for Production Ready Skills</h2>
                <p className={styles.catalogSubtitle}>
                    Hands-on structured tracks built with real-world architectures, zero fluff, and instant progress tracking.
                </p>

                <Tabs
                    items={tabItems}
                    activeId={shownTab}
                    onChange={setActiveTab}
                    variant="pill"
                    label="Learning path categories"
                    className={styles.catalogTabs}
                />
            </div>

            {/* Path Cards Grid */}
            <div className={styles.pathsCardsGrid}>
                {displayedPaths.map(path => {
                    const isOpen = openPathId === path.id;
                    const syllabus = (path.topics ?? []).slice(0, SYLLABUS_LENGTH).map(t => t.title);
                    const topicCount = path.topicCount ?? path.topics?.length ?? 0;
                    const studyTime = formatStudyTime(path.estimatedMinutes);
                    return (
                        <div
                            key={path.id}
                            className={`${styles.pathCardItem} ${isOpen ? styles.pathCardOpen : ''}`}
                            onClick={event => {
                                /*
                                 * A click on the syllabus toggle is not a click on the card. Same
                                 * split the shared Collapsible makes: the row is a mouse
                                 * convenience, the buttons inside it are the real controls.
                                 */
                                if ((event.target as HTMLElement | null)?.closest('button')) return;
                                onSelectCourse(path.id);
                            }}
                        >
                            <div className={styles.pathCardTopRow}>
                                <span className={styles.pathCategoryTag}>{path.category}</span>
                            </div>
                            <h3 className={styles.pathCardTitle}>{path.title}</h3>
                            <p className={styles.pathCardDesc}>{path.description}</p>
                            {/* Either figure can be missing - an older backend sends neither to a
                                visitor - so each shows only when it is actually known. */}
                            {(topicCount > 0 || studyTime) && (
                                <div className={styles.pathMetaRow}>
                                    {topicCount > 0 && (
                                        <span><Layers size={14} /> {topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}</span>
                                    )}
                                    {studyTime && <span><Clock size={14} /> {studyTime}</span>}
                                </div>
                            )}

                            {syllabus.length > 0 && <button
                                type="button"
                                className={styles.syllabusToggle}
                                aria-expanded={isOpen}
                                onClick={() => setOpenPathId(isOpen ? null : path.id)}
                            >
                                <ChevronDown
                                    size={14}
                                    className={`${styles.syllabusChevron} ${isOpen ? styles.syllabusChevronOpen : ''}`}
                                />
                                {isOpen ? 'Hide what’s inside' : 'See what’s inside'}
                            </button>}

                            {isOpen && syllabus.length > 0 && (
                                <ul className={styles.syllabusList}>
                                    {syllabus.map((topic, index) => (
                                        <li
                                            key={topic}
                                            className={styles.syllabusItem}
                                            // Staggers the list so it unrolls rather than appearing.
                                            style={{ animationDelay: `${index * 45}ms` }}
                                        >
                                            <Check size={13} className={styles.syllabusTick} />
                                            {topic}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className={styles.pathCardFooter}>
                                <button
                                    type="button"
                                    className={styles.startPathBtnText}
                                    onClick={() => onSelectCourse(path.id)}
                                >
                                    Start Path <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default CatalogBlock;
