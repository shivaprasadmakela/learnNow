import { useState, useCallback } from 'react';
import { fetchTopicDetails } from '../../shared/api';
import type { TopicDetails } from '../../shared/api';
import { useRecordActivity } from '../../features/activity';
import type { Course } from '../../types';

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

interface UseTopicSessionOptions {
    isLoggedIn: boolean;
    courses: Course[];
    changeView: (view: any, pathSlug?: string, topicSlug?: string) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    refreshUserData: () => Promise<void>;
}

export const useTopicSession = ({
    isLoggedIn,
    courses,
    changeView,
    showToast,
    refreshUserData
}: UseTopicSessionOptions) => {
    const [activeTopicId, setActiveTopicId] = useState<any | null>(null);
    const [activeTopic, setActiveTopic] = useState<TopicDetails | null>(null);
    const [isStudyLoading, setIsStudyLoading] = useState(false);
    const [isStudyUpdating, setIsStudyUpdating] = useState(false);

    const { recordTopicCompletion, recordSubtopicCompletion } = useRecordActivity();

    const handleSelectTopic = useCallback(async (id: any) => {
        if (!isLoggedIn) {
            changeView('LOGIN');
            return;
        }
        try {
            setIsStudyLoading(true);
            const details = await fetchTopicDetails(id);
            setActiveTopic(details);
            setActiveTopicId(id);

            const parentCourse = courses.find(c => c.topics?.some(s => s.id === id));
            const sub = parentCourse?.topics?.find(s => s.id === id);
            if (parentCourse && sub) {
                const pathSlug = parentCourse.title.toLowerCase().includes('java') ? 'java-backend-path' : 'path';
                const topicSlug = slugify(sub.title);
                changeView('STUDY', pathSlug, topicSlug);
            } else {
                changeView('STUDY', 'java-backend-path', slugify(details.title));
            }
        } catch (err) {
            console.error("Failed to load topic details", err);
            showToast("Failed to load topic details", "error");
        } finally {
            setIsStudyLoading(false);
        }
    }, [courses, changeView, showToast, isLoggedIn]);

    const handleToggleTopicComplete = async () => {
        if (!activeTopicId || !activeTopic) return;
        try {
            setIsStudyUpdating(true);
            const nextCompleted = !activeTopic.isCompleted;
            await recordTopicCompletion(activeTopicId, nextCompleted);

            const details = await fetchTopicDetails(activeTopicId);
            setActiveTopic(details);
            await refreshUserData();

            showToast(nextCompleted ? "Topic marked as completed! (+20 bonus points)" : "Topic marked as incomplete.", "success");
        } catch (err) {
            console.error("Failed to update topic status", err);
            showToast("Failed to update topic status", "error");
        } finally {
            setIsStudyUpdating(false);
        }
    };

    const handleToggleSubtopicComplete = async (subtopicId: string | number, completed: boolean) => {
        if (!activeTopicId || !activeTopic) return;
        try {
            setIsStudyUpdating(true);
            await recordSubtopicCompletion(subtopicId, completed);

            const details = await fetchTopicDetails(activeTopicId);
            setActiveTopic(details);
            await refreshUserData();

            showToast(completed ? "Section marked as read! (+5 points)" : "Section unmarked.", "success");
        } catch (err) {
            console.error("Failed to update subtopic status", err);
            showToast("Failed to update section status", "error");
        } finally {
            setIsStudyUpdating(false);
        }
    };

    const clearTopicSession = useCallback(() => {
        setActiveTopicId(null);
        setActiveTopic(null);
    }, []);

    return {
        activeTopicId,
        activeTopic,
        isStudyLoading,
        isStudyUpdating,
        handleSelectTopic,
        handleToggleTopicComplete,
        handleToggleSubtopicComplete,
        clearTopicSession
    };
};

export default useTopicSession;
