import React from 'react';
import { BookOpen } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import type { Course } from '../../../../types';
import type { PathProgressSummary } from '../../types';
import { Loader } from '../../../../shared/components/ui/Loader';

interface PathsOverviewProps {
    paths?: PathProgressSummary[];
    courses?: Course[];
    isLoading?: boolean;
    onSelectPath: (pathId: number) => void;
}

export const PathsOverview: React.FC<PathsOverviewProps> = ({ paths = [], courses = [], isLoading = false, onSelectPath }) => {
    if (isLoading) {
        return (
            <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                <Loader variant="inline" text="Loading learning paths..." showColdStartFunnyMessages={true} />
            </div>
        );
    }

    const itemsToRender = courses.length > 0
        ? courses.map(c => ({
            id: typeof c.id === 'number' ? c.id : 1,
            title: c.title,
            description: c.description,
            footerText: `${c.topics?.length || 0} Topics`,
            progressPercentage: c.progressPercentage || 0
        }))
        : paths.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            footerText: `${p.completedTopicsCount} / ${p.totalTopicsCount} Topics`,
            progressPercentage: p.progressPercentage
        }));

    if (itemsToRender.length === 0) {
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
            {itemsToRender.map((path) => (
                <LearningCard
                    key={path.id}
                    badgeLabel="Path"
                    title={path.title}
                    description={path.description}
                    footerText={path.footerText}
                    progressPercentage={path.progressPercentage}
                    showProgress={typeof path.progressPercentage === 'number' && path.progressPercentage > 0}
                    onClick={() => onSelectPath(path.id)}
                />
            ))}
        </div>
    );
};
