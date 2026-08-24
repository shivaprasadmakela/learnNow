import React from 'react';
import { ContentHeroBanner } from '../../../../shared/components/ui/ContentHeroBanner';
import type { TopicHeroBannerProps } from './TopicHeroBanner.types';

/**
 * A learning path's banner.
 *
 * Kept as a named component over the shared banner rather than inlining it at the call site,
 * because "what a path's header says" — the badge wording, how topics are pluralised, when the
 * button reads Continue instead of Start — belongs in one place.
 */
export const TopicHeroBanner: React.FC<TopicHeroBannerProps> = ({
    pathTitle,
    description,
    managedBy,
    activitiesCount,
    progressPercent,
    onContinueClick
}) => {
    const meta: string[] = [];
    if (managedBy) meta.push(`Managed by ${managedBy}`);
    if (typeof activitiesCount === 'number') {
        meta.push(`${activitiesCount} ${activitiesCount === 1 ? 'topic' : 'topics'}`);
    }

    return (
        <ContentHeroBanner
            badgeLabel="Path"
            badgeIcon={
                <i
                    className="fa-solid fa-dragon"
                    style={{ marginRight: '2px' }}
                    aria-hidden="true"
                />
            }
            title={pathTitle}
            description={description}
            meta={meta}
            progressPercent={progressPercent}
            actionLabel={progressPercent > 0 ? 'Continue' : 'Start Path'}
            onAction={onContinueClick}
        />
    );
};

export default TopicHeroBanner;
