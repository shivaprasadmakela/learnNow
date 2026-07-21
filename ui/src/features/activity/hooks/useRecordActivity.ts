import { useCallback } from 'react';
import { setTopicCompletion, setSubtopicCompletion } from '../api/activityApi';

export function useRecordActivity() {
    const recordTopicCompletion = useCallback(async (topicId: number, completed: boolean) => {
        await setTopicCompletion(topicId, completed);
    }, []);

    const recordSubtopicCompletion = useCallback(async (subtopicId: number, completed: boolean = true) => {
        await setSubtopicCompletion(subtopicId, completed);
    }, []);

    return {
        recordTopicCompletion,
        recordSubtopicCompletion
    };
}
