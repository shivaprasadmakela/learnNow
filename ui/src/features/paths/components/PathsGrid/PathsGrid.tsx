import React from 'react';
import styles from '../../styles/PathsPage.module.css';
import { LearningCard } from '../../../../shared/components/cards';
import type { PathsGridProps } from './PathsGrid.types';

export const PathsGrid: React.FC<PathsGridProps> = ({ paths, onSelectPath, isLoggedIn = false }) => {
    if (paths.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>No learning paths are available for this category yet.</p>
            </div>
        );
    }

    return (
        <div className={styles.pathsCardsGrid}>
            {paths.map((path) => (
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
    );
};
