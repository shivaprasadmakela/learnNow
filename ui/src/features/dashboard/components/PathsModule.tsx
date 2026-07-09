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
                    Shape <span style={{ color: '#1a73e8' }}>your</span> <span style={{ color: '#1a73e8' }}>fu</span><span style={{ color: '#ea4335' }}>ture</span> self
                </h1>
                <p className={styles.pathsSubtitle}>
                    Paths are collections of learnings designed to build deep skills in a particular area. Whether you're looking to earn achievements, build a collection of skill badges, or prepare for a certification, there are paths right for you. When you're done, share your accomplishments on social media and hiring platforms like LinkedIn and Credly.
                </p>
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
            <div className={styles.cardsGrid}>
                {filteredPaths.map((path, idx) => (
                    <div key={idx} className={styles.previewCard}>
                        <div className={styles.cardTags}>
                            <span
                                className={`${styles.cardTag} ${styles.tagPath}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    backgroundColor: 'var(--bg-secondary, #f1f3f4)',
                                    color: 'var(--text-primary, #3c4043)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                }}
                            >
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#000000', borderRadius: '1.5px', marginRight: '6px' }} />
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
                                className={styles.circleArrowBtn}
                                style={{
                                    backgroundColor: '#e8f0fe',
                                    color: '#1a73e8',
                                    border: 'none',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                title="Explore Path"
                            >
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
