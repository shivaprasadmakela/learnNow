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
    managedBy?: string;
    activitiesCount?: number;
    lastUpdated?: string;
    topics: Topic[];
    progressPercent?: number;
    onSelectTopic?: (id: number) => void;
}

export type PathRoadmapPageProps = TopicsPageProps;
