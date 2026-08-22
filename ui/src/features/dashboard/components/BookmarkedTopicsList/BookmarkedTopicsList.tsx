import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { fetchTopicDetails } from '../../../../shared/api/profile.api';
import { useBookmarks } from '../../../notes';
import type { Course } from '../../../../types';
import type { PathProgressSummary, TopicProgressSummary } from '../../types';

interface BookmarkedTopicsListProps {
    paths?: PathProgressSummary[];
    courses?: Course[];
    onSelectRecentTopic?: (topicId: number, pathId?: number) => void;
    onSelectPath: (pathId: number) => void;
}

interface ResolvedBookmark {
    /**
     * The topic's real id. `TopicProgressSummary.id` is typed as a number while the backend issues
     * UUIDs, so the raw id is kept alongside it - it is what identifies the card and what the
     * bookmark toggle and navigation must be given.
     */
    topicId: string | number;
    topic: TopicProgressSummary;
    pathTitle: string;
    pathId: number;
}

export const BookmarkedTopicsList: React.FC<BookmarkedTopicsListProps> = ({
    paths = [],
    courses = [],
    onSelectRecentTopic,
    onSelectPath
}) => {
    const { bookmarks, isLoading, toggleBookmark } = useBookmarks();

    // Match bookmarks to topics inside courses or paths
    const { resolved, unresolvedIds } = useMemo(() => {
        const matched: ResolvedBookmark[] = [];
        const missing: string[] = [];

        for (const b of bookmarks) {
            const idStr = String(b.topicId);
            let found = false;
            if (courses && courses.length > 0) {
                for (const c of courses) {
                    const topic = c.topics?.find(t => String(t.id) === idStr);
                    if (topic) {
                        matched.push({
                            topicId: topic.id,
                            topic: {
                                id: typeof topic.id === 'number' ? topic.id : 0,
                                title: topic.title,
                                description: topic.description || '',
                                category: topic.category || '',
                                duration: topic.duration || '',
                                completed: false,
                                progressPercentage: 0
                            },
                            pathTitle: c.title,
                            pathId: typeof c.id === 'number' ? c.id : 1
                        });
                        found = true;
                        break;
                    }
                }
            }

            if (!found && paths && paths.length > 0) {
                for (const p of paths) {
                    const topic = p.topics?.find(t => String(t.id) === idStr);
                    if (topic) {
                        matched.push({ topicId: topic.id, topic, pathTitle: p.title, pathId: p.id });
                        found = true;
                        break;
                    }
                }
            }

            if (!found) missing.push(idStr);
        }

        return { resolved: matched, unresolvedIds: missing };
    }, [bookmarks, courses, paths]);

    /**
     * Bookmarks whose topic is not in any list the dashboard happens to be holding.
     *
     * Paths and their topics are both paginated, so a bookmark on the fortieth topic of the ninth
     * path is simply not in `courses` - scanning alone would drop it from the list and leave the
     * user unable to reach a topic they explicitly saved. Fetching each missing topic by id keeps
     * the list complete no matter how far the user has scrolled elsewhere.
     */
    const [fetched, setFetched] = useState<Record<string, ResolvedBookmark | null>>({});

    useEffect(() => {
        const pending = unresolvedIds.filter(id => !(id in fetched));
        if (pending.length === 0) return;

        let cancelled = false;
        Promise.all(
            pending.map(async id => {
                try {
                    const details = await fetchTopicDetails(id);
                    return [
                        id,
                        {
                            topicId: id,
                            topic: {
                                id: typeof details.id === 'number' ? details.id : 0,
                                title: details.title,
                                description: details.description || '',
                                category: details.category || '',
                                duration: details.duration || '',
                                completed: Boolean(details.isCompleted),
                                progressPercentage: details.progressPercentage || 0
                            },
                            pathTitle: '',
                            pathId: 0
                        } as ResolvedBookmark
                    ] as const;
                } catch {
                    // A deleted or unpublished topic simply drops out of the list.
                    return [id, null] as const;
                }
            })
        ).then(entries => {
            if (cancelled) return;
            setFetched(prev => ({ ...prev, ...Object.fromEntries(entries) }));
        });

        return () => {
            cancelled = true;
        };
    }, [unresolvedIds, fetched]);

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

    const bookmarkedTopics: ResolvedBookmark[] = [
        ...resolved,
        ...unresolvedIds.map(id => fetched[id]).filter((b): b is ResolvedBookmark => Boolean(b))
    ];

    const isResolving = unresolvedIds.some(id => !(id in fetched));

    if (bookmarkedTopics.length === 0) {
        if (isResolving) {
            return (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading bookmarks...
                </div>
            );
        }
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
            {bookmarkedTopics.map(({ topicId, topic, pathId }) => (
                <LearningCard
                    key={String(topicId)}
                    badgeLabel="Topic"
                    isBookmarked={true}
                    onToggleBookmark={() => toggleBookmark(topicId)}
                    title={topic.title}
                    description={topic.description}
                    progressPercentage={topic.progressPercentage}
                    showProgress={true}
                    isCompleted={topic.completed}
                    onClick={() => {
                        if (onSelectRecentTopic) {
                            onSelectRecentTopic(topicId as number, pathId);
                        } else if (pathId) {
                            onSelectPath(pathId);
                        }
                    }}
                />
            ))}
        </div>
    );
};

export default BookmarkedTopicsList;
