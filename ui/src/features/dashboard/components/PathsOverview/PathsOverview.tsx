import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import type { Course } from '../../../../types';
import { Loader } from '../../../../shared/components/ui/Loader';
import { formatStudyTime } from '../../../../shared/utils/studyTime';
import styles from '../../styles/Dashboard.module.css';

/** The dashboard previews the catalog; the Paths page is where all of it is. */
const PREVIEW_COUNT = 5;

/** In progress, then not started, then finished. */
const previewRank = (course: Course) => {
    const progress = course.progressPercentage || 0;
    return progress >= 100 ? 2 : progress > 0 ? 0 : 1;
};

interface PathsOverviewProps {
    courses?: Course[];
    isLoading?: boolean;
    onSelectPath: (pathId: number) => void;
    /** Opens the Paths page with every path. */
    onViewAll?: () => void;
}

/**
 * The first few learning paths, with a link to the rest. Paths in progress come first, most
 * progress first, then paths not started, then finished ones - so the preview is the paths the
 * learner is actually working through, not the ones they are done with.
 */
export const PathsOverview: React.FC<PathsOverviewProps> = ({
    courses = [],
    isLoading = false,
    onSelectPath,
    onViewAll
}) => {
    if (isLoading) {
        return (
            <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                <Loader variant="inline" text="Loading learning paths..." showColdStartFunnyMessages={true} />
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <EmptyState
                icon={BookOpen}
                title="No Learning Paths Available"
                description="There are currently no learning paths available. Admin published courses will appear here."
            />
        );
    }

    const preview = [...courses]
        .sort((a, b) => previewRank(a) - previewRank(b) || (b.progressPercentage || 0) - (a.progressPercentage || 0))
        .slice(0, PREVIEW_COUNT);

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {preview.map(path => (
                    <LearningCard
                        key={path.id}
                        badgeLabel="Path"
                        title={path.title}
                        description={path.description}
                        footerText={`${path.topicCount ?? path.topics?.length ?? 0} Topics`}
                        duration={formatStudyTime(path.estimatedMinutes)}
                        progressPercentage={path.progressPercentage || 0}
                        showProgress={(path.progressPercentage || 0) > 0}
                        onClick={() => onSelectPath(path.id)}
                    />
                ))}
            </div>
            {onViewAll && (
                <button type="button" className={styles.viewAllPaths} onClick={onViewAll}>
                    View all paths
                    <ArrowRight size={16} aria-hidden="true" />
                </button>
            )}
        </>
    );
};
