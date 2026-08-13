export interface Topic {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted?: boolean;
    progressPercentage?: number;
}

export interface TopicsPageProps {
    pathTitle: string;
    description?: string;
    managedBy?: string;
    activitiesCount?: number;
    topics: Topic[];
    progressPercent?: number;
    onSelectTopic?: (id: number) => void;
}

export type PathRoadmapPageProps = TopicsPageProps;
