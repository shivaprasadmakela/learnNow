import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTopicDetails, invalidatePathsCache } from '../../shared/api';
import type { TopicDetails } from '../../shared/api';
import { useRecordActivity } from '../../features/activity';
import type { Course } from '../../types';

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

import type { ViewState } from '../../features/dashboard/hooks/useProfileDashboard';

interface UseTopicSessionOptions {
    isLoggedIn: boolean;
    courses: Course[];
    changeView: (view: ViewState, pathSlug?: string, topicSlug?: string) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    /**
     * Invalidates the cached path list without fetching it now. The study console does not
     * render that list, so refreshing it here only delayed the user.
     */
    markPathsStale?: () => void;
}

export const useTopicSession = ({
    isLoggedIn,
    courses,
    changeView,
    showToast,
    markPathsStale
}: UseTopicSessionOptions) => {
    const [activeTopicId, setActiveTopicId] = useState<string | number | null>(null);
    const [activeTopic, setActiveTopic] = useState<TopicDetails | null>(null);
    const [isStudyLoading, setIsStudyLoading] = useState(false);
    const [isStudyUpdating, setIsStudyUpdating] = useState(false);

    const { recordTopicCompletion, recordSubtopicCompletion } = useRecordActivity();

    const fetchingRef = useRef<string | number | null>(null);

    const handleSelectTopic = useCallback(async (id: string | number, subtopicId?: string | number, subtopicTitle?: string) => {
        if (!isLoggedIn) {
            changeView('LOGIN');
            return;
        }

        if (fetchingRef.current === id) return;
        fetchingRef.current = id;

        setActiveTopicId(id);
        setIsStudyLoading(true);

        const parentCourse = courses.find(c => c.topics?.some(s => s.id === id));
        const topicObj = parentCourse?.topics?.find(s => s.id === id);

        const pathSlug = parentCourse ? slugify(parentCourse.title) : 'path';
        const topicSlug = topicObj ? slugify(topicObj.title) : 'topic';
        const subSlug = subtopicTitle ? slugify(subtopicTitle) : (subtopicId ? String(subtopicId) : null);

        if (subSlug) {
            changeView('STUDY', pathSlug, `${topicSlug}/${subSlug}`);
        } else if (parentCourse && topicObj) {
            changeView('STUDY', pathSlug, topicSlug);
        } else {
            changeView('STUDY', 'path', 'topic');
        }

        try {
            const details = await fetchTopicDetails(id);
            setActiveTopic(details);
            if (details.title && (!parentCourse || !topicObj)) {
                if (subSlug) {
                    changeView('STUDY', 'path', `${slugify(details.title)}/${subSlug}`);
                } else {
                    changeView('STUDY', 'path', slugify(details.title));
                }
            }
        } catch (err) {
            console.error("Failed to load topic details", err);
            showToast("Failed to load topic details", "error");
        } finally {
            setIsStudyLoading(false);
            fetchingRef.current = null;
        }
    }, [courses, changeView, showToast, isLoggedIn]);

    const attemptedRestoreRef = useRef<string | null>(null);

    // Auto-restore topic session when URL matches /paths/:pathSlug/:topicSlug and activeTopic is null
    useEffect(() => {
        if (!isLoggedIn || activeTopic || isStudyLoading) return;
        if (typeof window === 'undefined') return;

        const path = window.location.pathname;
        if (attemptedRestoreRef.current === path) return;

        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 3 && parts[0] === 'paths') {
            const topicSlug = parts[2];
            if (!topicSlug) return;

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topicSlug);

            if (isUuid) {
                attemptedRestoreRef.current = path;
                if (String(activeTopicId) !== topicSlug) {
                    handleSelectTopic(topicSlug);
                }
                return;
            }

            if (courses.length === 0) return;

            attemptedRestoreRef.current = path;

            let foundTopicId: string | number | null = null;
            const normSlug = topicSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

            for (const course of courses) {
                if (course.topics) {
                    const match = course.topics.find(t => {
                        const tSlug = slugify(t.title);
                        const normTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return (
                            tSlug === topicSlug ||
                            normTitle === normSlug ||
                            String(t.id) === topicSlug
                        );
                    });
                    if (match) {
                        foundTopicId = match.id;
                        break;
                    }
                }
            }

            if (foundTopicId !== null && String(activeTopicId) !== String(foundTopicId)) {
                handleSelectTopic(foundTopicId);
            }
        }
    }, [isLoggedIn, activeTopic, activeTopicId, courses, isStudyLoading, handleSelectTopic]);

    const handleToggleTopicComplete = async () => {
        if (!activeTopicId || !activeTopic) return;
        try {
            setIsStudyUpdating(true);
            const nextCompleted = !activeTopic.isCompleted;
            await recordTopicCompletion(activeTopicId, nextCompleted);

            const details = await fetchTopicDetails(activeTopicId);
            setActiveTopic(details);
            // The topic details fetched above are what this screen renders. The path list and
            // its per-path topics are only shown on other views, so they are marked stale and
            // refetched when the user navigates there - rather than making them wait here for
            // two more round trips to a database on another continent.
            invalidatePathsCache();
            markPathsStale?.();

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
            // The topic details fetched above are what this screen renders. The path list and
            // its per-path topics are only shown on other views, so they are marked stale and
            // refetched when the user navigates there - rather than making them wait here for
            // two more round trips to a database on another continent.
            invalidatePathsCache();
            markPathsStale?.();

            showToast(completed ? "Section marked as read! (+5 points)" : "Section unmarked.", "success");
        } catch (err) {
            console.error("Failed to update subtopic status", err);
            showToast("Failed to update section status", "error");
        } finally {
            setIsStudyUpdating(false);
        }
    };

    const handleSelectNextTopic = useCallback(() => {
        if (!activeTopicId || !courses || courses.length === 0) return;
        for (const course of courses) {
            if (course.topics && course.topics.length > 0) {
                const idx = course.topics.findIndex(t => String(t.id) === String(activeTopicId));
                if (idx >= 0 && idx < course.topics.length - 1) {
                    const nextTopic = course.topics[idx + 1];
                    handleSelectTopic(nextTopic.id);
                    return;
                }
            }
        }
    }, [activeTopicId, courses, handleSelectTopic]);

    const clearTopicSession = useCallback(() => {
        setActiveTopicId(null);
        setActiveTopic(null);
        attemptedRestoreRef.current = null;
    }, []);

    return {
        activeTopicId,
        activeTopic,
        isStudyLoading,
        isStudyUpdating,
        handleSelectTopic,
        handleSelectNextTopic,
        handleToggleTopicComplete,
        handleToggleSubtopicComplete,
        clearTopicSession
    };
};

export default useTopicSession;
