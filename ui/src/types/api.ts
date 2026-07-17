import type { Subtopic } from '../features/roadmap/pages/RoadmapPage';

export interface PathData {
    id: number;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    subtopics?: Subtopic[];
}
