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

/**
 * A question as the interviewer asks it: the prompt, never the answer. The answer and the
 * follow-ups it leads to load when the learner reveals it (`fetchInterviewAnswer`).
 */
export interface InterviewQuestion {
    id: string;
    /** Set on opening questions only: where to revise if you cannot answer it. */
    topicId?: string | null;
    subtopicId?: string | null;
    subtopicTitle?: string | null;
    prompt: string;
    depth: number;
    practice: boolean;
    sightings: InterviewSighting[];
    /** How many follow-up questions revealing the answer unlocks. */
    followUpCount: number;
}

/** What "Reveal answer" shows: the answer, and the follow-ups it unlocks, as prompts. */
export interface InterviewReveal {
    questionId: string;
    /** The beginner answer; null on a question not yet rewritten, which has the three below. */
    answer?: InterviewAnswer | null;
    /** Earlier format: what to say in about thirty seconds. */
    answerShort?: string | null;
    /** Earlier format: the fuller answer, for when they dig. */
    answerDeep?: string | null;
    /** Earlier format: what the interviewer is checking by asking it. */
    answerSignal?: string | null;
    followUps: InterviewQuestion[];
}

/** One topic of a path's bank, as the topic list shows it: counts, not questions. */
export interface InterviewTopic {
    topicId: string;
    topicTitle: string;
    questionCount: number;
    followUpCount: number;
}

/**
 * Each level loads only when the learner opens it, and only once: a topic list, then a topic's
 * prompts, then one answer. A failed request is forgotten so the next attempt tries again.
 */
const cached = <T>(load: (id: string) => Promise<T>) => {
    const entries = new Map<string, Promise<T>>();
    return (id: string): Promise<T> => {
        let entry = entries.get(id);
        if (!entry) {
            entry = load(id).catch(err => {
                entries.delete(id);
                throw err;
            });
            entries.set(id, entry);
        }
        return entry;
    };
};

/** A path's topics that have questions, with their counts - the Interview tab's topic list. */
export const fetchPathInterviewTopics = cached((pathId: string) =>
    apiFetchJson<InterviewTopic[]>(`/api/catalog/interview/paths/${encodeURIComponent(pathId)}`)
);

/** A topic's opening questions in the order its lessons are taught, as prompts. */
export const fetchTopicInterviewQuestions = cached((topicId: string) =>
    apiFetchJson<InterviewQuestion[]>(`/api/catalog/interview/topics/${encodeURIComponent(topicId)}`)
);

/** One question's answer and the follow-ups it unlocks. */
export const fetchInterviewAnswer = cached((questionId: string) =>
    apiFetchJson<InterviewReveal>(`/api/catalog/interview/questions/${encodeURIComponent(questionId)}`)
);
