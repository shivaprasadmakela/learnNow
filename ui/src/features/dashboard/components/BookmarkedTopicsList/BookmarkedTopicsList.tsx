import React, { useCallback, useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import type { TopicRef } from '../../../../types';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import {
    fetchBookmarkSummaries,
    toggleBookmarkApi,
    type BookmarkSummaryDto
} from '../../../notes/api/notes.api';
import styles from './BookmarkedTopicsList.module.css';

interface BookmarkedTopicsListProps {
    onSelectRecentTopic?: (topic: TopicRef) => void;
    /** Opens a bookmarked DSA problem in the workspace. */
    onSelectDsaProblem?: (stepSlug: string, problemSlug: string) => void;
}

type Filter = 'all' | 'TOPIC' | 'DSA_PROBLEM';

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'TOPIC', label: 'Topics' },
    { id: 'DSA_PROBLEM', label: 'DSA' }
];

/**
 * The learner's bookmarks, topics and DSA problems together.
 *
 * One request, made when the tab opens, returns every bookmark with the title, place and progress
 * shown here. It used to take bare ids and then fetch each target in full - a topic with all its
 * lessons, a problem with its editorial - one request per bookmark.
 */
export const BookmarkedTopicsList: React.FC<BookmarkedTopicsListProps> = ({
    onSelectRecentTopic,
    onSelectDsaProblem
}) => {
    const [bookmarks, setBookmarks] = useState<BookmarkSummaryDto[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');

    const load = useCallback(() => {
        let cancelled = false;
        fetchBookmarkSummaries()
            .then(list => {
                if (!cancelled) {
                    setBookmarks(list);
                    setFailed(false);
                }
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => load(), [load]);

    /** Removing is the only toggle this list offers; the card goes at once, not after the trip. */
    const removeBookmark = async (entry: BookmarkSummaryDto) => {
        setBookmarks(prev => prev?.filter(b => b.id !== entry.id) ?? prev);
        try {
            const { bookmarked } = await toggleBookmarkApi(entry.targetId, entry.target);
            // The server disagreed - it had no such bookmark, so the toggle just created one.
            if (bookmarked) load();
        } catch {
            load();
        }
    };

    if (bookmarks === null) {
        return (
            <div className={styles.state}>
                {failed ? 'We could not load your bookmarks.' : 'Loading bookmarks...'}
            </div>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <EmptyState
                icon={Bookmark}
                title="No Bookmarks Yet"
                description="Bookmark a topic in the study console, or a problem on the DSA sheet, and it will show up here."
            />
        );
    }

    const counts = {
        all: bookmarks.length,
        TOPIC: bookmarks.filter(b => b.target === 'TOPIC').length,
        DSA_PROBLEM: bookmarks.filter(b => b.target === 'DSA_PROBLEM').length
    };

    const shown = filter === 'all' ? bookmarks : bookmarks.filter(b => b.target === filter);

    return (
        <div className={styles.wrap}>
            <Tabs
                items={FILTERS.map(f => ({ ...f, count: counts[f.id] }))}
                activeId={filter}
                onChange={setFilter}
                variant="pill"
                label="Bookmark type"
            />

            {shown.length === 0 ? (
                <div className={styles.state}>
                    {filter === 'DSA_PROBLEM'
                        ? 'No DSA problems bookmarked yet.'
                        : 'No topics bookmarked yet.'}
                </div>
            ) : (
                <div className={styles.grid}>
                    {shown.map(entry => {
                        const { topic, problem } = entry;
                        const solved = problem?.status === 'SOLVED';
                        const progress = topic ? topic.progressPercentage : solved ? 100 : 0;
                        return (
                            <LearningCard
                                key={entry.id}
                                badgeLabel={problem ? 'Problem' : 'Topic'}
                                isBookmarked={true}
                                onToggleBookmark={() => removeBookmark(entry)}
                                title={topic?.title ?? problem?.title ?? ''}
                                description={
                                    topic
                                        ? topic.description || ''
                                        : `${problem?.stepTitle} · ${problem?.difficulty}`
                                }
                                footerText={(topic ? topic.pathTitle : problem?.stepTitle) || undefined}
                                progressPercentage={progress}
                                showProgress={progress > 0}
                                isCompleted={topic ? topic.completed : solved}
                                onClick={() => {
                                    if (problem) {
                                        onSelectDsaProblem?.(problem.stepSlug, problem.slug);
                                    } else if (topic) {
                                        onSelectRecentTopic?.({
                                            topicId: entry.targetId,
                                            topicTitle: topic.title,
                                            pathTitle: topic.pathTitle
                                        });
                                    }
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BookmarkedTopicsList;
