import React, { useState } from 'react';
import { BookOpen, Clock, Layers, ArrowUpRight, ChevronDown, Check } from 'lucide-react';
import { Tabs } from '../../../shared/components';
import type { TabItem } from '../../../shared/components/ui/Tabs';
import styles from '../styles/Home.module.css';

interface CatalogBlockProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onSelectCourse: (courseId: number) => void;
}

const FEATURED_PATHS = [
    {
        id: 1,
        title: 'Backend Engineering & Spring Boot Monolith',
        category: 'Backend',
        description: 'Master Java 21, Spring Boot 3, JPA/Hibernate, Flyway migrations, and JWT security.',
        topicsCount: 8,
        duration: '14 Hours',
        level: 'Intermediate',
        badge: 'Popular',
        topics: [
            'Java 21 records, sealed types and pattern matching',
            'Spring Boot 3 modular service layout',
            'JPA entities, relationships and the N+1 trap',
            'Flyway migrations and schema versioning',
            'JWT security, filters and method-level rules'
        ]
    },
    {
        id: 2,
        title: 'Fullstack React 19 & TypeScript Architecture',
        category: 'Fullstack',
        description: 'Build modular React applications with custom CSS Module theme engines and Vite.',
        topicsCount: 6,
        duration: '10 Hours',
        level: 'All Levels',
        badge: 'Updated',
        topics: [
            'Feature-first folder structure that survives growth',
            'CSS Modules and a design-token theme engine',
            'Typed API clients and error boundaries',
            'Vite chunking, lazy routes and bundle budgets',
            'Testing components without testing React'
        ]
    },
    {
        id: 3,
        title: 'PostgreSQL Relational Schema & Optimization',
        category: 'Database',
        description: 'Design robust schemas, indexes, projections, window functions, and Flyway migrations.',
        topicsCount: 5,
        duration: '8 Hours',
        level: 'Advanced',
        badge: 'Essential',
        topics: [
            'Normalisation, and when to stop normalising',
            'Indexes: what they cost as well as what they save',
            'Reading EXPLAIN ANALYZE without guessing',
            'Window functions and set-returning queries',
            'Migrations that are safe to run on live data'
        ]
    }
];

export const CatalogBlock: React.FC<CatalogBlockProps> = ({
    activeTab,
    setActiveTab,
    onSelectCourse
}) => {
    /*
     * Which card has its syllabus open. One at a time — the cards sit in a grid row, and two open
     * at once pushes the row's height around for a card nobody asked about.
     */
    const [openPathId, setOpenPathId] = useState<number | null>(null);

    const categories = ['Featured', 'Backend', 'Fullstack', 'Database'];

    const pathsFor = (tab: string) =>
        tab === 'Featured' ? FEATURED_PATHS : FEATURED_PATHS.filter(path => path.category === tab);

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

    const displayedPaths = pathsFor(activeTab);

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
                    activeId={activeTab}
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
                                <span className={styles.pathBadgeTag}>{path.badge}</span>
                            </div>
                            <h3 className={styles.pathCardTitle}>{path.title}</h3>
                            <p className={styles.pathCardDesc}>{path.description}</p>
                            <div className={styles.pathMetaRow}>
                                <span><Layers size={14} /> {path.topicsCount} Topics</span>
                                <span><Clock size={14} /> {path.duration}</span>
                            </div>

                            <button
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
                            </button>

                            {isOpen && (
                                <ul className={styles.syllabusList}>
                                    {path.topics.map((topic, index) => (
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
                                <span className={styles.pathLevelText}>{path.level}</span>
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
