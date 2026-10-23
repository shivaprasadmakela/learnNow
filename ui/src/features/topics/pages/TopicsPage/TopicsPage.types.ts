import type { PathTrackRef } from '../../../../types';
import type { LessonOutline } from '../../../../shared/api/profile.api';

export interface Topic {
    id: number | string;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted?: boolean;
    progressPercentage?: number;
    subtopics?: LessonOutline[];
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
    /** Opens a career track; given, the banner links to the tracks this path is part of. */
    onSelectTrack?: (slug: string) => void;
    /** Opening interview questions on the path, from the path itself - labels the Interview tab. */
    interviewQuestionCount?: number;
    /** The career tracks this path is a step of, from the path itself. */
    tracks?: PathTrackRef[];
}

export type PathRoadmapPageProps = TopicsPageProps;
