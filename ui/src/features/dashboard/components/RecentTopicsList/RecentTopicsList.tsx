import React from 'react';
import styles from '../../styles/Dashboard.module.css';
import { LearningCard } from '../../../../shared/components/cards';
import type { RecentTopicActivity } from '../../types';

interface RecentTopicsListProps {
    topics: RecentTopicActivity[];
    onSelectTopic: (topicId: number) => void;
}

export const RecentTopicsList: React.FC<RecentTopicsListProps> = ({ topics, onSelectTopic }) => {
    if (topics.length === 0) {
        return (
            <div className={styles.emptyState}>
                <i className="fa-solid fa-seedling" style={{ fontSize: '2.2rem', color: 'var(--text-tertiary)', marginBottom: '14px' }} aria-hidden="true" />
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
                    Visit or complete topics to see your recent topic progress here.
                </p>
            </div>
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
