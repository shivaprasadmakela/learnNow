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

export interface InterviewQuestion {
    id: string;
    /** Set on opening questions only: where to revise if you cannot answer it. */
    topicId?: string | null;
    subtopicId?: string | null;
    subtopicTitle?: string | null;
    prompt: string;
    /** What to say in about thirty seconds. */
    answerShort: string;
    /** The fuller answer, for when they dig. */
    answerDeep: string;
    /** What the interviewer is checking by asking it. */
    answerSignal: string;
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

export const fetchPathInterviewQuestions = (pathId: string): Promise<InterviewTopic[]> =>
    apiFetchJson<InterviewTopic[]>(`/api/catalog/interview/paths/${encodeURIComponent(pathId)}`);

export const fetchSubtopicInterviewQuestions = (subtopicId: string): Promise<InterviewQuestion[]> =>
    apiFetchJson<InterviewQuestion[]>(
        `/api/catalog/interview/subtopics/${encodeURIComponent(subtopicId)}`
    );

/** Every question in a tree, follow-ups included. */
export const countQuestions = (questions: InterviewQuestion[]): number =>
    questions.reduce((n, q) => n + 1 + countQuestions(q.followUps), 0);
