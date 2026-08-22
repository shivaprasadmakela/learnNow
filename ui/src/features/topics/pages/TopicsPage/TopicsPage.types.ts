import type { SubtopicData } from '../../../../shared/api/profile.api';

export interface Topic {
    id: number | string;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted?: boolean;
    progressPercentage?: number;
    subtopics?: SubtopicData[];
}

export interface TopicsPageProps {
    pathId?: string | number;
    pathTitle: string;
    description?: string;
    managedBy?: string;
    activitiesCount?: number;
    topics: Topic[];
    /** Total topics on the path; `topics` holds only the pages fetched so far. */
    topicCount?: number;
    hasMoreTopics?: boolean;
    isLoadingMoreTopics?: boolean;
    onLoadMoreTopics?: () => void;
    progressPercent?: number;
    isAdmin?: boolean;
    onSelectTopic?: (id: number | string, subtopicId?: number | string, subtopicTitle?: string) => void;
    onAddTopicToPath?: (topicData: any) => Promise<boolean>;
    onAddSubtopicToTopic?: (topicId: string | number, subtopicData: any) => Promise<boolean>;
}

export type PathRoadmapPageProps = TopicsPageProps;
