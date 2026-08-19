import type { Topic } from '../features/topics';

export interface PathData {
    id: number;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    progressPercentage?: number;
    topics?: Topic[];
}
