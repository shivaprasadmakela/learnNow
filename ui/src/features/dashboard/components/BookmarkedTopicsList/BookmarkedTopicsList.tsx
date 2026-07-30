import React from 'react';
import { Bookmark } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { useBookmarks } from '../../../notes';
import type { PathProgressSummary, TopicProgressSummary } from '../../types';

interface BookmarkedTopicsListProps {
    paths?: PathProgressSummary[];
    onSelectRecentTopic?: (topicId: number, pathId?: number) => void;
    onSelectPath: (pathId: number) => void;
}

export const BookmarkedTopicsList: React.FC<BookmarkedTopicsListProps> = ({
    paths = [],
    onSelectRecentTopic,
    onSelectPath
}) => {
    const { bookmarks, isLoading } = useBookmarks();

    if (isLoading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading bookmarks...
            </div>
        );
    }

    if (!bookmarks || bookmarks.length === 0) {
        return (
            <EmptyState
                icon={Bookmark}
                title="No Bookmarks Yet"
                description="Click the bookmark icon on any topic in the Study Console to save topics here for quick access."
            />
        );
    }

    // Match bookmarks to topics inside paths
    const bookmarkedTopics: { topic: TopicProgressSummary; pathTitle: string; pathId: number }[] = [];

    for (const b of bookmarks) {
        const idStr = String(b.topicId);
        for (const p of paths) {
            const matched = p.topics?.find(t => String(t.id) === idStr);
            if (matched) {
                bookmarkedTopics.push({
                    topic: matched,
                    pathTitle: p.title,
                    pathId: p.id
                });
                break;
            }
        }
    }

    if (bookmarkedTopics.length === 0) {
        return (
            <EmptyState
                icon={Bookmark}
                title="No Bookmarked Topics Found"
                description="Bookmarked topics will appear here."
            />
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {bookmarkedTopics.map(({ topic, pathTitle, pathId }) => (
                <LearningCard
                    key={topic.id}
                    pathTitle={pathTitle}
                    badgeLabel="Bookmarked"
                    title={topic.title}
                    description={topic.description}
                    progressPercentage={topic.progressPercentage}
                    showProgress={true}
                    isCompleted={topic.completed}
                    onClick={() => {
                        if (onSelectRecentTopic) {
                            onSelectRecentTopic(topic.id, pathId);
                        } else {
                            onSelectPath(pathId);
                        }
                    }}
                />
            ))}
        </div>
    );
};
