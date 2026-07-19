import type { Topic } from '../features/roadmap';

export interface PathData {
    id: number;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    topics?: Topic[];
}
