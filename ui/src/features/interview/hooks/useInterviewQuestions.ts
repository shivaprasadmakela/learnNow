import { useEffect, useState } from 'react';
import {
    fetchInterviewAnswer,
    fetchPathInterviewTopics,
    fetchTopicInterviewQuestions,
    type InterviewQuestion,
    type InterviewReveal,
    type InterviewTopic
} from '../api/interview.api';

// Content ids are UUIDs. Older or mock data can carry numbers or slugs, which the API would reject
// with a 400 - so those are treated as having nothing to fetch rather than sent at all.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const asId = (id: string | number | undefined | null): string =>
    id !== undefined && id !== null && UUID.test(String(id)) ? String(id) : '';

export interface FetchState<T> {
    data: T | null;
    loading: boolean;
    failed: boolean;
}

/**
 * Fetches only while given an id: pass undefined until the learner opens the thing that shows the
 * data, and nothing is requested. Results are kept with the id they were fetched for, so the last
 * topic's questions never show while the next one loads.
 */
function useFetchWhenOpen<T>(
    id: string | number | undefined | null,
    fetcher: (id: string) => Promise<T>
): FetchState<T> {
    const key = asId(id);
    const [state, setState] = useState<{ key: string; data: T | null; failed: boolean }>({
        key: '',
        data: null,
        failed: false
    });

    useEffect(() => {
        if (!key) return;
        let cancelled = false;
        fetcher(key)
            .then(data => {
                if (!cancelled) setState({ key, data, failed: false });
            })
            .catch(() => {
                if (!cancelled) setState({ key, data: null, failed: true });
            });
        return () => {
            cancelled = true;
        };
    }, [key, fetcher]);

    if (!key) return { data: null, loading: false, failed: false };
    return state.key === key
        ? { data: state.data, loading: false, failed: state.failed }
        : { data: null, loading: true, failed: false };
}

/** A path's interview topics with their counts - fetched once the Interview tab is open. */
export const usePathInterviewTopics = (pathId: string | number | undefined | null): FetchState<InterviewTopic[]> =>
    useFetchWhenOpen(pathId, fetchPathInterviewTopics);

/** A topic's opening questions, as prompts - fetched once the topic is opened. */
export const useTopicInterviewQuestions = (
    topicId: string | number | undefined | null
): FetchState<InterviewQuestion[]> => useFetchWhenOpen(topicId, fetchTopicInterviewQuestions);

/** One question's answer and follow-ups - fetched when "Reveal answer" is pressed. */
export const useInterviewAnswer = (questionId: string | undefined): FetchState<InterviewReveal> =>
    useFetchWhenOpen(questionId, fetchInterviewAnswer);
