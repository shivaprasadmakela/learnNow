import React from 'react';
import { BookOpen } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import type { PathProgressSummary } from '../../types';

interface PathsOverviewProps {
    paths: PathProgressSummary[];
    onSelectPath: (pathId: number) => void;
}

export const PathsOverview: React.FC<PathsOverviewProps> = ({ paths, onSelectPath }) => {
    if (!paths || paths.length === 0) {
        return (
            <EmptyState
                icon={BookOpen}
                title="No Learning Paths Available"
                description="There are currently no learning paths available. Admin published courses will appear here."
            />
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {paths.map((path) => (
                <LearningCard
                    key={path.id}
                    badgeLabel={path.category || 'Path'}
                    title={path.title}
                    description={path.description}
                    footerText={`${path.completedTopicsCount} / ${path.totalTopicsCount} Topics`}
                    progressPercentage={path.progressPercentage}
                    showProgress={typeof path.progressPercentage === 'number' && path.progressPercentage > 0}
                    onClick={() => onSelectPath(path.id)}
                />
            ))}
        </div>
    );
};
