import React, { useMemo, useState } from 'react';
import { Code2, Globe2 } from 'lucide-react';
import type { Course } from '../../../types';
import styles from '../styles/PathsPage.module.css';
import { LearningCard } from '../../../shared/components/cards';

interface PathsPageProps {
    courses: Course[];
    onSelectPath: (pathId: number) => void;
    isLoggedIn?: boolean;
}

export const PathsPage: React.FC<PathsPageProps> = ({ courses, onSelectPath, isLoggedIn = false }) => {
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
                    Discover top-tier learning content and easy-to-follow courses to build your skills. Complete your path and showcase your achievements directly to hiring platforms.
                </p>
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
                    <LearningCard
                        key={path.id}
                        badgeLabel="Path"
                        title={path.title}
                        description={path.description}
                        footerText={path.managedBy || 'Managed by Google Cloud'}
                        progressPercentage={isLoggedIn && typeof path.progressPercentage === 'number' ? path.progressPercentage : undefined}
                        showProgress={isLoggedIn && typeof path.progressPercentage === 'number' && path.progressPercentage > 0}
                        onClick={() => onSelectPath(path.id)}
                        buttonTooltip={isLoggedIn ? "Explore Path" : "Login to Enter Path"}
                    />
                ))}
            </div>
        </div>
    );
};
