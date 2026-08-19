import type { Topic } from '../../pages/TopicsPage/TopicsPage.types';

export interface TopicCardListProps {
    topics: Topic[];
    viewMode: 'grid' | 'list';
    onTopicClick: (id: number | string, title: string, subtopicId?: number | string, subtopicTitle?: string) => void;
}
