import React from 'react';
import { Activity } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import type { RecentTopicActivity } from '../../types';

interface RecentTopicsListProps {
    topics: RecentTopicActivity[];
    onSelectTopic: (topicId: number) => void;
}

export const RecentTopicsList: React.FC<RecentTopicsListProps> = ({ topics, onSelectTopic }) => {
    if (topics.length === 0) {
        return (
            <EmptyState
                icon={Activity}
                title="No Recent Activity"
                description="Start exploring learning paths and studying topics to track your progress here."
            />
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {topics.map((item) => (
                <LearningCard
                    key={item.topicId}
                    badgeLabel="Topic"
                    title={item.topicTitle}
                    description={item.pathTitle ? `Path: ${item.pathTitle}` : undefined}
                    progressPercentage={item.progressPercentage}
                    showProgress={true}
                    isCompleted={item.completed}
                    onClick={() => onSelectTopic(item.topicId)}
                />
            ))}
        </div>
    );
};
