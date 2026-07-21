import { apiFetch } from '../../../shared/api/client';

export const setTopicCompletion = async (topicId: number, completed: boolean): Promise<void> => {
    const response = await apiFetch(`/api/me/topics/${topicId}/completion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
    });
    if (!response.ok) throw new Error('Failed to set topic completion status');
};

export const setSubtopicCompletion = async (subtopicId: number, completed: boolean = true): Promise<void> => {
    const response = await apiFetch(`/api/me/subtopics/${subtopicId}/completion?completed=${completed}`, {
        method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to set subtopic completion status');
};
