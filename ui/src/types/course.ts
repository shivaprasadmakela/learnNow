import type { Topic } from '../features/topics';

export interface Course {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    level: string;
    imageUrl: string;
    managedBy?: string;
    progressPercentage?: number;
    topics?: Topic[];
}
