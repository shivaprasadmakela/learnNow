import { useEffect, useState } from 'react';
import {
    fetchPathInterviewQuestions,
    fetchTopicInterviewQuestions,
    type InterviewQuestion,
    type InterviewTopic
} from '../api/interview.api';

// Content ids are UUIDs. Older or mock data can carry numbers or slugs, which the API would reject
// with a 400 - so those are treated as having no questions rather than sent at all.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const asId = (id: string | number | undefined | null): string =>
    id !== undefined && id !== null && UUID.test(String(id)) ? String(id) : '';

/**
 * Questions are an addition to the lessons, not part of them: empty while loading and empty on
 * failure, so a slow or failed request leaves the page exactly as it was rather than showing an
 * error. Results are kept with the id they were fetched for, so the previous path's or topic's
 * questions never show while the next one loads.
 */
function useInterviewFetch<T>(
    id: string | number | undefined | null,
    fetcher: (id: string) => Promise<T[]>
): { items: T[]; loading: boolean } {
    const key = asId(id);
    const [state, setState] = useState<{ key: string; items: T[] }>({ key: '', items: [] });

    useEffect(() => {
        if (!key) return;
        let cancelled = false;
        fetcher(key)
            .then(items => {
                if (!cancelled) setState({ key, items });
            })
            .catch(() => {
                if (!cancelled) setState({ key, items: [] });
            });
        return () => {
            cancelled = true;
        };
    }, [key, fetcher]);

    if (!key) return { items: [], loading: false };
    return state.key === key ? { items: state.items, loading: false } : { items: [], loading: true };
}

/** A topic's questions in lesson order - the study console's Interview tab. */
export const useTopicInterviewQuestions = (
    topicId: string | number | undefined | null
): InterviewQuestion[] => useInterviewFetch(topicId, fetchTopicInterviewQuestions).items;

export interface PathInterviewState {
    topics: InterviewTopic[];
    loading: boolean;
}

/** A path's questions grouped by topic - the Interview tab on the path page. */
export const usePathInterviewQuestions = (
    pathId: string | number | undefined | null
): PathInterviewState => {
    const { items, loading } = useInterviewFetch(pathId, fetchPathInterviewQuestions);
    return { topics: items, loading };
};
