import React, { useState } from 'react';
import { useToast } from '../../../../shared/components/feedback/Toast';
import styles from './TopicsPage.module.css';
import type { TopicsPageProps } from './TopicsPage.types';
import { TopicHeroBanner } from '../../components/TopicHeroBanner';
import { ViewModeToggle } from '../../components/ViewModeToggle';
import { TopicCardList } from '../../components/TopicCardList';

export const TopicsPage: React.FC<TopicsPageProps> = ({
    pathTitle,
    description,
    managedBy = 'learnNow',
    activitiesCount,
    topics,
    progressPercent = 0,
    onSelectTopic
}) => {
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const dynamicCount = typeof activitiesCount === 'number' ? activitiesCount : (topics ? topics.length : 0);

    const handleTopicClick = (id: number, title: string) => {
        if (onSelectTopic) {
            onSelectTopic(id);
        } else {
            showToast(`"${title}" workspace lessons are launching soon!`, 'info');
        }
    };

    const handleContinueClick = () => {
        if (topics && topics.length > 0) {
            handleTopicClick(topics[0].id, topics[0].title);
        } else {
            showToast("Path launch is in progress!", "info");
        }
    };

    return (
        <div className={styles.container}>
            <TopicHeroBanner
                pathTitle={pathTitle}
                description={description}
                managedBy={managedBy}
                activitiesCount={dynamicCount}
                progressPercent={progressPercent}
                onContinueClick={handleContinueClick}
            />

            <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            <TopicCardList
                topics={topics}
                viewMode={viewMode}
                onTopicClick={handleTopicClick}
            />
        </div>
    );
};

// Aliased export for backwards compatibility
export const PathRoadmapPage = TopicsPage;
export type PathRoadmapPageProps = TopicsPageProps;

export default TopicsPage;
