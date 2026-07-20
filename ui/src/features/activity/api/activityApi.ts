import { apiFetch } from '../../../shared/api/client';

export const setTopicCompletion = async (topicId: number, completed: boolean, eventId: string): Promise<void> => {
    const response = await apiFetch(`/api/me/topics/${topicId}/completion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, eventId })
    });
    if (!response.ok) throw new Error('Failed to set topic completion status');
};
