import type { Topic } from '../../pages/TopicsPage/TopicsPage.types';

export interface TopicCardListProps {
    topics: Topic[];
    viewMode: 'grid' | 'list';
    onTopicClick: (id: number | string, title: string, subtopicId?: number | string, subtopicTitle?: string) => void;
    /** Another page of this path's topics exists on the server. */
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
}
