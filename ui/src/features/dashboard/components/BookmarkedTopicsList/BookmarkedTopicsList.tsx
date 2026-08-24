import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { LearningCard } from '../../../../shared/components/cards';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import { fetchTopicDetails } from '../../../../shared/api/profile.api';
import { fetchDsaProblemById } from '../../../dsa/api/dsa.api';
import { useBookmarks } from '../../../notes';
import type { NoteTarget } from '../../../notes/api/notes.api';
import type { Course } from '../../../../types';
import type { PathProgressSummary, TopicProgressSummary } from '../../types';
import styles from './BookmarkedTopicsList.module.css';

interface BookmarkedTopicsListProps {
    paths?: PathProgressSummary[];
    courses?: Course[];
    onSelectRecentTopic?: (topicId: number, pathId?: number) => void;
    onSelectPath: (pathId: number) => void;
    /** Opens a bookmarked DSA problem in the workspace. */
    onSelectDsaProblem?: (stepSlug: string, problemSlug: string) => void;
}

interface ResolvedBookmark {
    /** The target's real id. UUIDs, so never coerced to a number. */
    targetId: string;
    target: NoteTarget;
    topic: TopicProgressSummary;
    pathTitle: string;
    pathId: number;
    /** DSA only — where the workspace lives. */
    stepSlug?: string;
    problemSlug?: string;
    difficulty?: string;
}

type Filter = 'all' | 'TOPIC' | 'DSA_PROBLEM';

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'TOPIC', label: 'Topics' },
    { id: 'DSA_PROBLEM', label: 'DSA' }
];

export const BookmarkedTopicsList: React.FC<BookmarkedTopicsListProps> = ({
    paths = [],
    courses = [],
    onSelectRecentTopic,
    onSelectPath,
    onSelectDsaProblem
}) => {
    const { allBookmarks, isLoading, toggleBookmark } = useBookmarks();
    const [filter, setFilter] = useState<Filter>('all');

    /**
     * Topic bookmarks resolved from what the dashboard is already holding, plus the ids it could
     * not account for.
     *
     * Paths and their topics are both paginated, so a bookmark on the fortieth topic of the ninth
     * path is simply not in `courses`. Scanning alone would drop it and leave the learner unable to
     * reach something they explicitly saved.
     */
    const { resolved, unresolved } = useMemo(() => {
        const matched: ResolvedBookmark[] = [];
        const missing: { id: string; target: NoteTarget }[] = [];

        for (const bookmark of allBookmarks) {
            const idStr = String(bookmark.targetId);

            if (bookmark.target === 'DSA_PROBLEM') {
                // Problems are never in `courses`; they always need a lookup.
                missing.push({ id: idStr, target: 'DSA_PROBLEM' });
                continue;
            }

            let found = false;
            for (const course of courses) {
                const topic = course.topics?.find(t => String(t.id) === idStr);
                if (topic) {
                    matched.push({
                        targetId: idStr,
                        target: 'TOPIC',
                        topic: {
                            id: typeof topic.id === 'number' ? topic.id : 0,
                            title: topic.title,
                            description: topic.description || '',
                            category: topic.category || '',
                            duration: topic.duration || '',
                            completed: false,
                            progressPercentage: 0
                        },
                        pathTitle: course.title,
                        pathId: typeof course.id === 'number' ? course.id : 1
                    });
                    found = true;
                    break;
                }
            }

            if (!found) {
                for (const path of paths) {
                    const topic = path.topics?.find(t => String(t.id) === idStr);
                    if (topic) {
                        matched.push({
                            targetId: idStr,
                            target: 'TOPIC',
                            topic,
                            pathTitle: path.title,
                            pathId: path.id
                        });
                        found = true;
                        break;
                    }
                }
            }

            if (!found) missing.push({ id: idStr, target: 'TOPIC' });
        }

        return { resolved: matched, unresolved: missing };
    }, [allBookmarks, courses, paths]);

    const [fetched, setFetched] = useState<Record<string, ResolvedBookmark | null>>({});

    useEffect(() => {
        const pending = unresolved.filter(u => !(u.id in fetched));
        if (pending.length === 0) return;

        let cancelled = false;
        Promise.all(
            pending.map(async ({ id, target }) => {
                try {
                    if (target === 'DSA_PROBLEM') {
                        const problem = await fetchDsaProblemById(id);
                        return [
                            id,
                            {
                                targetId: id,
                                target,
                                topic: {
                                    id: 0,
                                    title: problem.title,
                                    description: problem.stepTitle
                                        ? `${problem.stepTitle} · ${problem.difficulty}`
                                        : problem.difficulty,
                                    category: problem.difficulty,
                                    duration: `${problem.estimatedMinutes} min`,
                                    completed: problem.progress?.status === 'SOLVED',
                                    progressPercentage:
                                        problem.progress?.status === 'SOLVED' ? 100 : 0
                                },
                                pathTitle: problem.stepTitle ?? 'DSA',
                                pathId: 0,
                                stepSlug: problem.stepSlug,
                                problemSlug: problem.slug,
                                difficulty: problem.difficulty
                            } as ResolvedBookmark
                        ] as const;
                    }

                    const details = await fetchTopicDetails(id);
                    return [
                        id,
                        {
                            targetId: id,
                            target,
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
                    // A deleted or unpublished target simply drops out of the list.
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
    }, [unresolved, fetched]);

    if (isLoading) {
        return <div className={styles.state}>Loading bookmarks...</div>;
    }

    if (allBookmarks.length === 0) {
        return (
            <EmptyState
                icon={Bookmark}
                title="No Bookmarks Yet"
                description="Bookmark a topic in the study console, or a problem on the DSA sheet, and it will show up here."
            />
        );
    }

    const everything: ResolvedBookmark[] = [
        ...resolved,
        ...unresolved.map(u => fetched[u.id]).filter((b): b is ResolvedBookmark => Boolean(b))
    ];

    const counts = {
        all: everything.length,
        TOPIC: everything.filter(b => b.target === 'TOPIC').length,
        DSA_PROBLEM: everything.filter(b => b.target === 'DSA_PROBLEM').length
    };

    const shown = filter === 'all' ? everything : everything.filter(b => b.target === filter);
    const isResolving = unresolved.some(u => !(u.id in fetched));

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
                    {isResolving
                        ? 'Loading bookmarks...'
                        : filter === 'DSA_PROBLEM'
                          ? 'No DSA problems bookmarked yet.'
                          : 'No topics bookmarked yet.'}
                </div>
            ) : (
                <div className={styles.grid}>
                    {shown.map(entry => (
                        <LearningCard
                            key={`${entry.target}-${entry.targetId}`}
                            badgeLabel={entry.target === 'DSA_PROBLEM' ? 'Problem' : 'Topic'}
                            isBookmarked={true}
                            onToggleBookmark={() => toggleBookmark(entry.targetId)}
                            title={entry.topic.title}
                            description={entry.topic.description}
                            footerText={entry.pathTitle || undefined}
                            progressPercentage={entry.topic.progressPercentage}
                            showProgress={entry.topic.progressPercentage > 0}
                            isCompleted={entry.topic.completed}
                            onClick={() => {
                                if (entry.target === 'DSA_PROBLEM') {
                                    if (onSelectDsaProblem && entry.stepSlug && entry.problemSlug) {
                                        onSelectDsaProblem(entry.stepSlug, entry.problemSlug);
                                    }
                                } else if (onSelectRecentTopic) {
                                    onSelectRecentTopic(entry.targetId as unknown as number, entry.pathId);
                                } else if (entry.pathId) {
                                    onSelectPath(entry.pathId);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookmarkedTopicsList;
