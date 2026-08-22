import React, { useState } from 'react';
import { ChevronRight, Check, ArrowRight, Play, BookOpen, Clock, Award } from 'lucide-react';
import styles from './TopicCardList.module.css';
import pageStyles from '../../pages/TopicsPage/TopicsPage.module.css';
import { LearningCard } from '../../../../shared/components/cards';
import { CardBadge } from '../../../../shared/components/cards/LearningCard/components/CardBadge';
import { CardActionArrow } from '../../../../shared/components/cards/LearningCard/components/CardActionArrow';
import { CardCompletedBadge } from '../../../../shared/components/cards/LearningCard/components/CardCompletedBadge';
import { InfiniteScrollSentinel } from '../../../../shared/components/ui/InfiniteScrollSentinel';
import { useBookmarks } from '../../../notes';
import { fetchTopicDetails, type SubtopicData } from '../../../../shared/api/profile.api';
import type { TopicCardListProps } from './TopicCardList.types';

export const TopicCardList: React.FC<TopicCardListProps> = ({
    topics,
    viewMode,
    onTopicClick,
    hasMore = false,
    isLoadingMore = false,
    onLoadMore
}) => {
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const [expandedTopics, setExpandedTopics] = useState<Record<string | number, boolean>>({});
    const [topicSubtopics, setTopicSubtopics] = useState<Record<string | number, SubtopicData[]>>({});
    const [loadingTopics, setLoadingTopics] = useState<Record<string | number, boolean>>({});

    const moreTopics = onLoadMore ? (
        <InfiniteScrollSentinel
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={onLoadMore}
            loadingText="Loading more topics..."
            loadMoreLabel="Load more topics"
        />
    ) : null;

    const toggleExpand = async (topicId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        const currentlyExpanded = Boolean(expandedTopics[topicId]);
        setExpandedTopics(prev => ({ ...prev, [topicId]: !currentlyExpanded }));

        // Lazily fetch subtopics if expanding and not already loaded
        if (!currentlyExpanded && !topicSubtopics[topicId]) {
            const existing = topics.find(t => String(t.id) === String(topicId))?.subtopics;
            if (existing && existing.length > 0) {
                setTopicSubtopics(prev => ({ ...prev, [topicId]: existing }));
            } else {
                try {
                    setLoadingTopics(prev => ({ ...prev, [topicId]: true }));
                    const details = await fetchTopicDetails(topicId);
                    if (details && details.subtopics) {
                        setTopicSubtopics(prev => ({ ...prev, [topicId]: details.subtopics }));
                    }
                } catch (err) {
                    console.error("Failed to load subtopics for topic accordion", err);
                } finally {
                    setLoadingTopics(prev => ({ ...prev, [topicId]: false }));
                }
            }
        }
    };

    if (viewMode === 'grid') {
        return (
            <div className={pageStyles.courseGrid}>
                {topics.map((topic) => {
                    const topicPct = topic.isCompleted ? 100 : (topic.progressPercentage || 0);
                    const bookmarked = isBookmarked(topic.id);

                    return (
                        <LearningCard
                            key={topic.id}
                            layout="grid"
                            badgeLabel="Topic"
                            title={topic.title}
                            description={topic.description}
                            duration={topic.duration || '2 hours'}
                            progressPercentage={topicPct}
                            showProgress={topicPct > 0}
                            isCompleted={topic.isCompleted}
                            isBookmarked={bookmarked}
                            onToggleBookmark={() => toggleBookmark(topic.id)}
                            onClick={() => onTopicClick(topic.id, topic.title)}
                            buttonTooltip={`Explore ${topic.title}`}
                        />
                    );
                })}
                {moreTopics}
            </div>
        );
    }

    // List view mode: Ultra-sleek single line header row + timeline accordion
    return (
        <div className={styles.accordionContainer}>
            {topics.map((topic) => {
                const topicPct = topic.isCompleted ? 100 : (topic.progressPercentage || 0);
                const isExpanded = Boolean(expandedTopics[topic.id]);
                const subtopics = topicSubtopics[topic.id] || topic.subtopics || [];
                const isLoading = Boolean(loadingTopics[topic.id]);
                const subtopicsCount = subtopics.length || 0;

                return (
                    <div
                        key={topic.id}
                        className={`${styles.topicAccordionItem} ${isExpanded ? styles.topicAccordionItemExpanded : ''}`}
                    >
                        <div
                            className={styles.topicHeaderRow}
                            onClick={(e) => toggleExpand(topic.id, e)}
                        >
                            <div className={styles.topicTitleGroup}>
                                <button
                                    type="button"
                                    className={`${styles.chevronBtn} ${isExpanded ? styles.chevronBtnExpanded : ''}`}
                                    onClick={(e) => toggleExpand(topic.id, e)}
                                    title={isExpanded ? "Collapse subtopics" : "Expand subtopics"}
                                >
                                    <ChevronRight size={18} />
                                </button>

                                <CardBadge label="Topic" isCompleted={topic.isCompleted} />

                                <span className={styles.topicTitleText}>{topic.title}</span>

                                {subtopicsCount > 0 && (
                                    <span className={styles.subtopicsBadge}>
                                        {subtopicsCount} {subtopicsCount === 1 ? 'lesson' : 'lessons'}
                                    </span>
                                )}
                            </div>

                            <div className={styles.topicStatusGroup}>
                                <span className={styles.topicPctText}>{topicPct}%</span>

                                <div className={styles.progressRingWrapper}>
                                    {topic.isCompleted ? (
                                        <CardCompletedBadge />
                                    ) : (
                                        <svg className={styles.progressRingSvg} width="24" height="24" viewBox="0 0 36 36">
                                            <path
                                                className={styles.progressRingBg}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path
                                                className={styles.progressRingMeter}
                                                strokeDasharray={`${topicPct}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                        </svg>
                                    )}
                                </div>

                                <CardActionArrow
                                    tooltip={`Explore ${topic.title}`}
                                    onClick={(e) => {
                                        e?.stopPropagation();
                                        onTopicClick(topic.id, topic.title);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Expanded Subtopics Timeline Tree */}
                        {isExpanded && (
                            <div className={styles.subtopicTimelineContainer}>
                                {isLoading ? (
                                    <div className={styles.timelineLoading}>
                                        <div className={styles.pulseDot} />
                                        Loading lessons...
                                    </div>
                                ) : subtopics.length > 0 ? (
                                    (() => {
                                        const lastCompletedIdx = subtopics.reduce(
                                            (acc: number, st: SubtopicData, idx: number) => (st.isCompleted ? idx : acc),
                                            -1
                                        );
                                        const progressPct =
                                            subtopics.length > 1 && lastCompletedIdx >= 0
                                                ? (lastCompletedIdx / (subtopics.length - 1)) * 100
                                                : 0;

                                        return (
                                            <div className={styles.timelineTree}>
                                                {/* Background Gray Track Line */}
                                                <div className={styles.timelineTrackBg} />

                                                {/* Active Blue Progress Track Line */}
                                                {lastCompletedIdx >= 0 && (
                                                    <div
                                                        className={styles.timelineTrackActive}
                                                        style={{ height: `calc(${progressPct}% - ${(1 - progressPct / 100) * 0}px)` }}
                                                    />
                                                )}

                                                {subtopics.map((st: SubtopicData, stIdx: number) => {
                                                    const stCompleted = Boolean(st.isCompleted);
                                                    return (
                                                        <div
                                                            key={st.id || stIdx}
                                                            className={`${styles.timelineItem} ${stCompleted ? styles.timelineItemCompleted : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onTopicClick(topic.id, topic.title, st.id, st.title);
                                                            }}
                                                        >
                                                            <div className={styles.timelineNodeWrapper}>
                                                                {stCompleted ? (
                                                                    <div className={styles.nodeCompletedBadge}>
                                                                        <Check size={14} strokeWidth={3} />
                                                                    </div>
                                                                ) : (
                                                                    <div className={styles.nodePendingBadge} />
                                                                )}
                                                            </div>

                                                    <div className={styles.timelineContentRow}>
                                                        <span className={styles.timelineText}>{st.title}</span>

                                                        <div className={styles.timelineMetaTags}>
                                                            {st.estimatedMinutes && (
                                                                <span className={styles.metaPill}>
                                                                    <Clock size={11} />
                                                                    {st.estimatedMinutes}m
                                                                </span>
                                                            )}
                                                            {st.track && (
                                                                <span className={styles.metaTrackPill}>
                                                                    {st.track === 'hands-on' ? <Play size={10} /> : <BookOpen size={10} />}
                                                                    {st.track}
                                                                </span>
                                                            )}
                                                            <span className={styles.xpPill}>
                                                                <Award size={11} />
                                                                +5 XP
                                                            </span>

                                                            <span className={styles.itemHoverAction}>
                                                                {stCompleted ? 'Review' : 'Start'}
                                                                <ArrowRight size={12} style={{ marginLeft: '3px' }} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()
                                ) : (
                                    <div className={styles.timelineLoading}>No subtopics listed for this topic yet.</div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            {moreTopics}
        </div>
    );
};
