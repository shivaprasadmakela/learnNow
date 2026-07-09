import React, { useState } from 'react';
import type { Course } from '../../../types';
import styles from './Dashboard.module.css';
import { HomeIcon } from '../../../shared/components/Icons';

interface PathsModuleProps {
    courses: Course[];
    isLoggedIn: boolean;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS') => void;
}

export const PathsModule: React.FC<PathsModuleProps> = ({ courses, isLoggedIn, changeView }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Only show "All" and "Backend" categories
    const categories = ['All', 'Backend'];

    // Only show the Java Backend Path in this module for now
    const pathsInModule = courses.filter(c =>
        c.category.toLowerCase() === 'backend' &&
        c.title.toLowerCase().includes('java')
    );

    // Apply category filtering within the allowed paths
    const filteredPaths = pathsInModule.filter(path => {
        if (selectedCategory === 'All') return true;
        return path.category.toLowerCase() === selectedCategory.toLowerCase();
    });

    const getCategoryIcon = (category: string) => {
        if (category === 'Backend') {
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
                </svg>
            );
        }
        // Default/All icon
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        );
    };

    return (
        <div className={styles.container}>
            {/* Top Row with Breadcrumbs on Left and Google Cloud Console on Right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', width: '100%' }}>
                {/* Paths Catalog Header */}
                <div className={styles.pathsBreadcrumb} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span
                        className={styles.breadcrumbLink}
                        onClick={() => changeView(isLoggedIn ? 'DASHBOARD' : 'HOME')}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                    >
                        <HomeIcon size={16} />
                    </span>
                    <span className={styles.breadcrumbDivider}>&gt;</span>
                    <span className={styles.breadcrumbActive}>Paths</span>
                </div>
            </div>

            <div className={styles.pathsHeader}>
                <h1 className={styles.pathsTitle}>
                    Shape <span>your</span> <span>future</span> self
                </h1>
                <p className={styles.pathsSubtitle}>
                    Discover top-tier learning content and easy-to-follow courses to build your skills. Complete your path and showcase your achievements directly to hiring platforms.                </p>
            </div>

            {/* Category Filters Row */}
            <div className={styles.categoriesRow} style={{ justifyContent: 'center', marginBottom: '32px' }}>
                {categories.map((cat, idx) => (
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
            <div className={styles.pathsCardsGrid}>
                {filteredPaths.map((path, idx) => (
                    <div key={idx} className={styles.previewCard}>
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
                            <button className={styles.circleArrowBtnScreenshot} title="Explore Path">
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
    );
};
