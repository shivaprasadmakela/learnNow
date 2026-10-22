import { apiFetchJson } from '../../../shared/api/client';

/**
 * Interview questions anchored to subtopics, each with the follow-ups an interviewer would ask.
 *
 * `practice` is true until someone has reported being asked the question; the UI then shows no
 * provenance at all rather than a label learners found confusing. There is deliberately no source
 * link on a sighting: it exists for admins to verify a report, and the API never sends it.
 */

export interface InterviewSighting {
    company: string;
    role?: string | null;
    level?: string | null;
    round?: string | null;
    /** The first of the month it was asked; the day is not known. */
    seenMonth?: string | null;
}

/**
 * An answer built the way a beginner learns it and then says it. Sections are Markdown, so a step
 * can carry a code block. `usage` and `caution` are optional.
 */
export interface InterviewAnswer {
    /** What it is, in two or three plain sentences. */
    simple: string;
    /** How it works or how to do it. */
    how: string;
    /** How to run or use it. */
    usage?: string | null;
    /** A real-world example. */
    example: string;
    /** The answer to give, first person, ready to say out loud. */
    script: string;
    /** One line to remember it by. */
    remember: string;
    /** The one important point people get wrong. */
    caution?: string | null;
}

export interface InterviewQuestion {
    id: string;
    /** Set on opening questions only: where to revise if you cannot answer it. */
    topicId?: string | null;
    subtopicId?: string | null;
    subtopicTitle?: string | null;
    prompt: string;
    /** The beginner answer; null on a question not yet rewritten, which has the three below. */
    answer?: InterviewAnswer | null;
    /** Earlier format: what to say in about thirty seconds. */
    answerShort?: string | null;
    /** Earlier format: the fuller answer, for when they dig. */
    answerDeep?: string | null;
    /** Earlier format: what the interviewer is checking by asking it. */
    answerSignal?: string | null;
    depth: number;
    practice: boolean;
    sightings: InterviewSighting[];
    followUps: InterviewQuestion[];
}

/** One topic of a path and its interview questions, in the order the path teaches them. */
export interface InterviewTopic {
    topicId: string;
    topicTitle: string;
    questions: InterviewQuestion[];
}

/** A path's questions, grouped by topic - the Interview tab on the path page. */
export const fetchPathInterviewQuestions = (pathId: string): Promise<InterviewTopic[]> =>
    apiFetchJson<InterviewTopic[]>(`/api/catalog/interview/paths/${encodeURIComponent(pathId)}`);

/** A topic's opening questions, each with its follow-ups, in the order its lessons are taught. */
export const fetchTopicInterviewQuestions = (topicId: string): Promise<InterviewQuestion[]> =>
    apiFetchJson<InterviewQuestion[]>(`/api/catalog/interview/topics/${encodeURIComponent(topicId)}`);

/** Every question in a tree, follow-ups included. */
export const countQuestions = (questions: InterviewQuestion[]): number =>
    questions.reduce((n, q) => n + 1 + countQuestions(q.followUps), 0);
