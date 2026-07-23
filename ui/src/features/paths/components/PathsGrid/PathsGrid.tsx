import React from 'react';
import { Compass } from 'lucide-react';
import styles from '../../styles/PathsPage.module.css';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import type { PathsGridProps } from './PathsGrid.types';

export const PathsGrid: React.FC<PathsGridProps> = ({ paths, onSelectPath, isLoggedIn = false }) => {
    if (paths.length === 0) {
        return (
            <EmptyState
                icon={Compass}
                title="No Learning Paths Found"
                description="No learning paths are available for this category yet. Check back soon for newly published courses!"
            />
        );
    }

    return (
        <div className={styles.pathsCardsGrid}>
            {paths.map((path) => (
                <LearningCard
                    key={path.id}
                    badgeLabel={path.category || 'Path'}
                    title={path.title}
                    description={path.description}
                    footerText={path.managedBy || 'learnNow'}
                    progressPercentage={isLoggedIn && typeof path.progressPercentage === 'number' ? path.progressPercentage : undefined}
                    showProgress={isLoggedIn && typeof path.progressPercentage === 'number' && path.progressPercentage > 0}
                    onClick={() => onSelectPath(path.id)}
                    buttonTooltip={isLoggedIn ? "Explore Path" : "Login to Enter Path"}
                />
            ))}
        </div>
    );
};
