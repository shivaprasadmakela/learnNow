import React, { useMemo, useState } from 'react';
import { ArrowRight, Code2, Globe2 } from 'lucide-react';
import type { Course } from '../../../types';
import styles from '../styles/PathsPage.module.css';

interface PathsPageProps {
    courses: Course[];
    onSelectPath: (pathId: number) => void;
}

export const PathsPage: React.FC<PathsPageProps> = ({ courses, onSelectPath }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = useMemo(
        () => ['All', ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean)))],
        [courses]
    );

    const filteredPaths = courses.filter(path => {
        if (selectedCategory === 'All') return true;
        return path.category === selectedCategory;
    });

    const getCategoryIcon = (category: string) => category === 'Backend'
        ? <Code2 size={20} aria-hidden="true" />
        : <Globe2 size={20} aria-hidden="true" />;

    return (
        <div className={styles.container}>

            <div className={styles.pathsHeader}>
                <h1 className={styles.pathsTitle}>
                    Shape <span>your</span> <span>future</span> self
                </h1>
                <p className={styles.pathsSubtitle}>
                    Discover top-tier learning content and easy-to-follow courses to build your skills. Complete your path and showcase your achievements directly to hiring platforms.                </p>
            </div>

            {/* Category Filters Row */}
            <div className={styles.categoriesRow} style={{ justifyContent: 'center', marginBottom: '32px' }}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        className={`${styles.categoryItem} ${selectedCategory === cat ? styles.categoryItemActive : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        <div className={styles.categoryIcon}>
                            {getCategoryIcon(cat)}
                        </div>
                        <span className={styles.categoryLabel}>{cat}</span>
                    </button>
                ))}
            </div>

            {/* Dynamic Cards Grid */}
            <div className={styles.pathsCardsGrid}>
                {filteredPaths.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No learning paths are available for this category yet.</p>
                    </div>
                ) : filteredPaths.map((path) => (
                    <article
                        key={path.id}
                        className={styles.previewCard}
                    >
                        <div className={styles.cardTags}>
                            <span className={styles.tagPathScreenshot}>
                                <span className={styles.tagPathIcon} />
                                Path
                            </span>
                        </div>
                        <h3 className={styles.cardTitle}>{path.title}</h3>
                        <p className={styles.cardDesc}>{path.description}</p>
                        <div className={styles.cardFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {path.managedBy || 'Managed by Academy'}
                            </span>
                            <button
                                type="button"
                                className={styles.circleArrowBtnScreenshot} 
                                title="Explore Path"
                                onClick={() => onSelectPath(path.id)}
                            >
                                <ArrowRight size={20} aria-hidden="true" />
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};
