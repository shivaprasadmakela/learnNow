import React, { useMemo, useState } from 'react';
import type { Course } from '../../../types';
import styles from '../styles/PathsPage.module.css';
import { CategoryFilterPills } from '../components/CategoryFilterPills';
import { PathsGrid } from '../components/PathsGrid';

import { Loader } from '../../../shared/components/ui/Loader';

export interface PathsPageProps {
    courses: Course[];
    onSelectPath: (pathId: number) => void;
    isLoggedIn?: boolean;
    isLoading?: boolean;
}

export const PathsPage: React.FC<PathsPageProps> = ({ courses, onSelectPath, isLoggedIn = false, isLoading = false }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = useMemo(
        () => ['All', ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean)))],
        [courses]
    );

    const filteredPaths = courses.filter(path => {
        if (selectedCategory === 'All') return true;
        return path.category === selectedCategory;
    });

    if (isLoading) {
        return (
            <div className={styles.container} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader variant="inline" text="Loading learning paths..." showColdStartFunnyMessages={true} />
            </div>
        );
    }

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

            <CategoryFilterPills
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            <PathsGrid
                paths={filteredPaths}
                onSelectPath={onSelectPath}
                isLoggedIn={isLoggedIn}
            />
        </div>
    );
};

export default PathsPage;
