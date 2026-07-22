import React from 'react';
import styles from '../../pages/TopicsPage/TopicsPage.module.css';
import { LearningCard } from '../../../../shared/components/cards';
import type { TopicCardListProps } from './TopicCardList.types';

export const TopicCardList: React.FC<TopicCardListProps> = ({ topics, viewMode, onTopicClick }) => {
    return (
        <div className={viewMode === 'grid' ? styles.courseGrid : styles.subtopicListContainer}>
            {topics.map((topic) => {
                const topicPct = topic.isCompleted ? 100 : (topic.progressPercentage || 0);

                return (
                    <LearningCard
                        key={topic.id}
                        layout={viewMode}
                        badgeLabel={topic.category || 'Course'}
                        title={topic.title}
                        description={viewMode === 'grid' ? topic.description : undefined}
                        duration={topic.duration || '2 hours'}
                        progressPercentage={topicPct}
                        showProgress={topicPct > 0}
                        isCompleted={topic.isCompleted}
                        onClick={() => onTopicClick(topic.id, topic.title)}
                        buttonTooltip={`Explore ${topic.title}`}
                    />
                );
            })}
        </div>
    );
};
