import React from 'react';
import { BookOpen, Clock, Layers, ArrowUpRight } from 'lucide-react';
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
        badge: 'Popular'
    },
    {
        id: 2,
        title: 'Fullstack React 19 & TypeScript Architecture',
        category: 'Fullstack',
        description: 'Build modular React applications with custom CSS Module theme engines and Vite.',
        topicsCount: 6,
        duration: '10 Hours',
        level: 'All Levels',
        badge: 'Updated'
    },
    {
        id: 3,
        title: 'PostgreSQL Relational Schema & Optimization',
        category: 'Database',
        description: 'Design robust schemas, indexes, projections, window functions, and Flyway migrations.',
        topicsCount: 5,
        duration: '8 Hours',
        level: 'Advanced',
        badge: 'Essential'
    }
];

export const CatalogBlock: React.FC<CatalogBlockProps> = ({
    activeTab,
    setActiveTab,
    onSelectCourse
}) => {
    const tabs = ['Featured', 'Backend', 'Fullstack', 'Database'];

    const displayedPaths = activeTab === 'Featured'
        ? FEATURED_PATHS
        : FEATURED_PATHS.filter(p => p.category === activeTab);

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

                {/* Category Pills */}
                <div className={styles.categoryTabsRow}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            className={`${styles.categoryTabBtn} ${activeTab === tab ? styles.categoryTabActive : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Path Cards Grid */}
            <div className={styles.pathsCardsGrid}>
                {displayedPaths.map(path => (
                    <div
                        key={path.id}
                        className={styles.pathCardItem}
                        onClick={() => onSelectCourse(path.id)}
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
                        <div className={styles.pathCardFooter}>
                            <span className={styles.pathLevelText}>{path.level}</span>
                            <span className={styles.startPathBtnText}>
                                Start Path <ArrowUpRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CatalogBlock;
