export interface PathData {
    id: number;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    progressPercentage?: number;
    /** Total published topics on the path. They load from /api/paths/{id}/topics when it opens. */
    topicCount?: number;
    /** Sum of the authored minutes of the path's published lessons. */
    estimatedMinutes?: number;
    /** Opening interview questions on the path - the Interview tab's label, before any are loaded. */
    interviewQuestionCount?: number;
    /** Career tracks the path is a step of. */
    tracks?: PathTrackRef[];
}

/** A career track a path belongs to - enough to link to it. */
export interface PathTrackRef {
    slug: string;
    title: string;
}
