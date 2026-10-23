import type { Topic } from '../features/topics';
import type { PathTrackRef } from './api';

export interface Course {
    id: number;
    title: string;
    description: string;
    category: string;
    managedBy?: string;
    progressPercentage?: number;
    /**
     * Total topics on the path, as reported by the server. `topics` holds only the pages loaded
     * so far, so this is what tells the UI whether scrolling should fetch more.
     */
    topicCount?: number;
    /** Sum of the authored minutes of the path's published lessons; see formatStudyTime. */
    estimatedMinutes?: number;
    /** Opening interview questions on the path - labels the Interview tab without loading it. */
    interviewQuestionCount?: number;
    /** Career tracks the path is a step of. */
    tracks?: PathTrackRef[];
    /** The topic pages loaded so far; none until the path is opened. */
    topics?: Topic[];
}
