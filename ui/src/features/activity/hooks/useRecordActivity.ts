import { useCallback } from 'react';
import { setTopicCompletion } from '../api/activityApi';

export function useRecordActivity() {
    const recordTopicCompletion = useCallback(async (topicId: number, completed: boolean) => {
        const eventId = window.crypto.randomUUID();
        await setTopicCompletion(topicId, completed, eventId);
    }, []);

    return {
        recordTopicCompletion
    };
}
