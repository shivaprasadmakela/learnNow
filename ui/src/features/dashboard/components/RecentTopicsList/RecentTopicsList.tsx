import React from 'react';
import { Activity } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import type { RecentTopicActivity, PathProgressSummary } from '../../types';

interface RecentTopicsListProps {
    topics: RecentTopicActivity[];
    paths?: PathProgressSummary[];
    onSelectTopic: (topicId: number) => void;
}

export const RecentTopicsList: React.FC<RecentTopicsListProps> = ({ topics, paths, onSelectTopic }) => {
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
            {topics.map((item) => {
                let topicDesc: string | undefined = undefined;
                if (paths) {
                    for (const p of paths) {
                        const matchedTopic = p.topics?.find(t => t.id === item.topicId);
                        if (matchedTopic?.description) {
                            topicDesc = matchedTopic.description;
                            break;
                        }
                    }
                }

                return (
                    <LearningCard
                        key={item.topicId}
                        pathTitle={item.pathTitle}
                        badgeLabel="Topic"
                        title={item.topicTitle}
                        description={topicDesc}
                        progressPercentage={item.progressPercentage}
                        showProgress={true}
                        isCompleted={item.completed}
                        onClick={() => onSelectTopic(item.topicId)}
                    />
                );
            })}
        </div>
    );
};
