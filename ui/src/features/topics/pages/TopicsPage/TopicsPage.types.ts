import type { SubtopicData } from '../../../../shared/api/profile.api';

export interface Topic {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted?: boolean;
    progressPercentage?: number;
    subtopics?: SubtopicData[];
}

export interface TopicsPageProps {
    pathTitle: string;
    description?: string;
    managedBy?: string;
    activitiesCount?: number;
    topics: Topic[];
    progressPercent?: number;
    onSelectTopic?: (id: number, subtopicId?: number | string, subtopicTitle?: string) => void;
}

export type PathRoadmapPageProps = TopicsPageProps;
