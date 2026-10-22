/**
 * A lesson to open next, with the titles it takes to show it and build its URL. The server sends
 * one wherever the app offers "Continue": a career track's roadmap and the dashboard's card.
 */
export interface NextLesson {
    pathId: string;
    pathTitle: string;
    topicId: string;
    topicTitle: string;
    subtopicId: string;
    subtopicTitle: string;
}

/** A topic to open in the study console: enough to build its URL without loading the path list. */
export interface TopicRef {
    topicId: string | number;
    topicTitle: string;
    pathTitle?: string | null;
}
