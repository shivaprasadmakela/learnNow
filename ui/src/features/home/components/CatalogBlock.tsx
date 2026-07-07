import React from 'react';
import type { Course } from '../../../types';
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

export const CatalogBlock: React.FC<CatalogBlockProps> = () => {
    return (
        <section id="catalog-section" className={styles.darkBlockContainer}>
            <div className={styles.darkBlock}>
                {/* Heading */}
                <div className={styles.darkBlockHeader} style={{ marginBottom: '24px' }}>
                    <h2 className={styles.darkBlockTitle}>Skill up on development today</h2>
                    <p className={styles.darkBlockDesc}>
                        Software engineering is constantly changing. Learn backend architectures,
                        frontend hooks, and API integrations with hands-on practice.
                    </p>
                </div>

                {/* Coming Soon catalog view */}
                <div className={styles.comingSoonCatalog}>
                    <div className={styles.comingSoonCard}>
                        <div className={styles.comingSoonIcon}>🚀</div>
                        <h3 className={styles.comingSoonTitle}>Courses & Learning Paths Coming Soon</h3>
                        <p className={styles.comingSoonDesc}>
                            We are currently designing hands-on interactive courses and learning paths. Register or Sign In to access your user profile dashboard, track your streak, and be ready when we launch!
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
export default CatalogBlock;
