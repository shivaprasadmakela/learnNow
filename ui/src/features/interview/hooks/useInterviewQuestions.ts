import { useEffect, useState } from 'react';
import {
    fetchPathInterviewQuestions,
    fetchSubtopicInterviewQuestions,
    type InterviewQuestion,
    type InterviewTopic
} from '../api/interview.api';

// Content ids are UUIDs. Older or mock data can carry numbers or slugs, which the API would reject
// with a 400 - so those are treated as having no questions rather than sent at all.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const asId = (id: string | number | undefined | null): string =>
    id !== undefined && id !== null && UUID.test(String(id)) ? String(id) : '';

/**
 * Questions are an addition to a lesson, not part of it: empty while loading and empty on failure,
 * so a slow or failed request leaves the lesson exactly as it was rather than showing an error.
 */
export const useSubtopicInterviewQuestions = (
    subtopicId: string | number | undefined | null
): InterviewQuestion[] => {
    const key = asId(subtopicId);
    const [state, setState] = useState<{ key: string; questions: InterviewQuestion[] }>({
        key: '',
        questions: []
    });

    useEffect(() => {
        if (!key) return;
        let cancelled = false;
        fetchSubtopicInterviewQuestions(key)
            .then(questions => {
                if (!cancelled) setState({ key, questions });
            })
            .catch(() => {
                if (!cancelled) setState({ key, questions: [] });
            });
        return () => {
            cancelled = true;
        };
    }, [key]);

    // Never show the previous subtopic's questions while the next one loads.
    return state.key === key ? state.questions : [];
};

export interface PathInterviewState {
    topics: InterviewTopic[];
    loading: boolean;
}

export const usePathInterviewQuestions = (
    pathId: string | number | undefined | null
): PathInterviewState => {
    const key = asId(pathId);
    const [state, setState] = useState<{ key: string; topics: InterviewTopic[] }>({
        key: '',
        topics: []
    });

    useEffect(() => {
        if (!key) return;
        let cancelled = false;
        fetchPathInterviewQuestions(key)
                        .then(topics => {
                if (!cancelled) setState({ key, topics });
            })
            .catch(() => {
                if (!cancelled) setState({ key, topics: [] });
            });
        return () => {
            cancelled = true;
        };
    }, [key]);

    if (!key) return { topics: [], loading: false };
    return state.key === key
        ? { topics: state.topics, loading: false }
        : { topics: [], loading: true };
};
