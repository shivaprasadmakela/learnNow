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
    /**
     * Total topics on the path, as reported by the server. `topics` holds only the pages loaded
     * so far, so this is what tells the UI whether scrolling should fetch more.
     */
    topicCount?: number;
    topics?: Topic[];
}
