import type { Topic } from '../features/topics';

export interface PathData {
    id: number;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    progressPercentage?: number;
    /** Total topics on the path. `topics` holds only the first page of them. */
    topicCount?: number;
    topics?: Topic[];
}
