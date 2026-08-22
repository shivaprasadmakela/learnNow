import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Search, CheckCircle2, BookOpen, Plus, Unlink } from 'lucide-react';
import type { AdminTopicData } from '../../../api/admin.api';
import { fetchAdminTopicsLibraryPage } from '../../../api/admin.api';
import { DEFAULT_PAGE_SIZE } from '../../../../../shared/api/pagination';
import { InfiniteScrollSentinel } from '../../../../../shared/components/ui/InfiniteScrollSentinel';
import styles from './AttachTopicModal.module.css';

interface AttachTopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingTopicIds: string[];
    onAttachTopic: (topic: AdminTopicData) => void;
    onUnlinkTopic?: (topicId: string) => void;
}

export const AttachTopicModal: React.FC<AttachTopicModalProps> = ({
    isOpen,
    onClose,
    existingTopicIds,
    onAttachTopic,
    onUnlinkTopic
}) => {
    const [library, setLibrary] = useState<AdminTopicData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const pageRef = useRef(0);
    /**
     * The list scrolls inside the modal, not the page, so the observer has to watch this element -
     * against the viewport the sentinel would count as visible from the moment the modal opened.
     */
    const [scrollBody, setScrollBody] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setIsLoading(true);
        fetchAdminTopicsLibraryPage(0, DEFAULT_PAGE_SIZE)
            .then(result => {
                if (cancelled) return;
                setLibrary(result.content);
                pageRef.current = 0;
                setHasMore(result.hasNext);
            })
            .catch(err => console.error('Failed to load topic library', err))
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        const nextPage = pageRef.current + 1;
        try {
            const result = await fetchAdminTopicsLibraryPage(nextPage, DEFAULT_PAGE_SIZE);
            setLibrary(prev => {
                const seen = new Set(prev.map(t => t.id));
                return [...prev, ...result.content.filter(t => !seen.has(t.id))];
            });
            pageRef.current = nextPage;
            setHasMore(result.hasNext);
        } catch (err) {
            console.error('Failed to load more topics', err);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore]);

    if (!isOpen) return null;

    const filtered = library.filter(t => {
        const query = searchQuery.toLowerCase();
        return (
            t.title.toLowerCase().includes(query) ||
            (t.category && t.category.toLowerCase().includes(query)) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
    });

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} style={{ color: 'var(--tech-blue)' }} />
                        <h3 className={styles.title}>Global Topic Library</h3>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.searchBar}>
                    <Search size={15} className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search global topics by title, category..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.body} ref={setScrollBody}>
                    {isLoading ? (
                        <div className={styles.loadingState}>Loading global topic library...</div>
                    ) : filtered.length === 0 && !hasMore ? (
                        <div className={styles.emptyState}>No topics found matching "{searchQuery}".</div>
                    ) : (
                        <ul className={styles.topicList}>
                            {filtered.map(t => {
                                const isAttached = Boolean(t.id && existingTopicIds.includes(t.id));
                                return (
                                    <li key={t.id || t.title} className={styles.topicCard}>
                                        <div className={styles.topicMain}>
                                            <div className={styles.titleRow}>
                                                <span className={styles.topicTitle}>{t.title}</span>
                                                <span className={styles.categoryBadge}>{t.category || 'Topic'}</span>
                                            </div>
                                            <p className={styles.desc}>{t.description || 'No description provided.'}</p>
                                            <span className={styles.subCount}>
                                                {(t.subtopics || []).length} subtopic lessons
                                            </span>
                                        </div>

                                        {isAttached ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={styles.attachedBadge}>
                                                    <CheckCircle2 size={14} /> Added
                                                </span>
                                                {onUnlinkTopic && t.id && (
                                                    <button
                                                        type="button"
                                                        className={styles.unlinkBtn}
                                                        onClick={() => onUnlinkTopic(t.id!)}
                                                        title="Unlink topic from this path"
                                                    >
                                                        <Unlink size={13} /> Unlink
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.attachBtn}
                                                onClick={() => onAttachTopic(t)}
                                            >
                                                <Plus size={14} /> Attach Topic
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/*
                      Outside the list so a search that matches nothing on the loaded pages keeps
                      pulling the rest of the library instead of reporting "no topics found".
                    */}
                    {!isLoading && (
                        <InfiniteScrollSentinel
                            hasMore={hasMore}
                            isLoading={isLoadingMore}
                            onLoadMore={loadMore}
                            root={scrollBody}
                            loadingText="Loading more topics..."
                            loadMoreLabel="Load more topics"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
