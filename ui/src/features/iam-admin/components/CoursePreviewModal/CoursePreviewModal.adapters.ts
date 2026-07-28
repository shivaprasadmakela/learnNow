import type { AdminTopicData } from '../../api/admin.api';
import type { TopicDetails } from '../../../../shared/api/profile.api';
import type { Topic } from '../../../topics/pages/TopicsPage/TopicsPage.types';

/** Convert raw AdminTopicData[] → Topic[] for the TopicsPage list */
export const toTopicList = (topics: AdminTopicData[]): Topic[] =>
    topics.map((t, idx) => ({
        id: idx,
        title: t.title,
        description: t.description,
        category: t.category || 'Topic',
        duration: t.duration || '~',
        isCompleted: false,
        progressPercentage: 0,
    }));

/** Convert one AdminTopicData → TopicDetails for StudyConsole */
export const toTopicDetails = (topic: AdminTopicData, topicIdx: number): TopicDetails => ({
    id: topicIdx,
    title: topic.title,
    description: topic.description,
    category: topic.category || 'Topic',
    duration: topic.duration || '~',
    isCompleted: false,
    progressPercentage: 0,
    subtopics: (topic.subtopics || []).map((s, sIdx) => ({
        id: sIdx,
        title: s.title,
        content: s.content,
        orderIndex: s.orderIndex,
        isCompleted: false,
    })),
});
