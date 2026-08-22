import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTopicDetails, invalidatePathsCache } from '../../shared/api';
import type { TopicDetails } from '../../shared/api';
import { useRecordActivity } from '../../features/activity';
import type { Course } from '../../types';

import { slugify, matchesSlug } from '../../shared/utils/slug';

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
    /**
     * Turns the slugs in a study URL into a topic id, fetching pages of paths and topics if the
     * ones named are not loaded. Needed on a hard refresh, where nothing is.
     */
    resolveTopicIdBySlug?: (pathSlug: string, topicSlug: string) => Promise<string | number | null>;
}

export const useTopicSession = ({
    isLoggedIn,
    courses,
    changeView,
    showToast,
    markPathsStale,
    resolveTopicIdBySlug
}: UseTopicSessionOptions) => {
    const [activeTopicId, setActiveTopicId] = useState<string | number | null>(null);
    const [activeTopic, setActiveTopic] = useState<TopicDetails | null>(null);
    const [isStudyLoading, setIsStudyLoading] = useState(false);
    const [isStudyUpdating, setIsStudyUpdating] = useState(false);

    const { recordTopicCompletion, recordSubtopicCompletion } = useRecordActivity();

    const fetchingRef = useRef<string | number | null>(null);

    /**
     * Opens a topic.
     *
     * `keepUrl` is for reopening the topic a URL already names, where the address bar is the
     * source of truth: rewriting it from whatever is loaded would drop the subtopic the link
     * points at, and drop the path slug entirely when the path list has not been fetched.
     */
    const handleSelectTopic = useCallback(async (
        id: string | number,
        subtopicId?: string | number,
        subtopicTitle?: string,
        keepUrl: boolean = false
    ) => {
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

        if (!keepUrl) {
            if (subSlug) {
                changeView('STUDY', pathSlug, `${topicSlug}/${subSlug}`);
            } else if (parentCourse && topicObj) {
                changeView('STUDY', pathSlug, topicSlug);
            } else {
                changeView('STUDY', 'path', 'topic');
            }
        }

        try {
            const details = await fetchTopicDetails(id);
            setActiveTopic(details);
            if (!keepUrl && details.title && (!parentCourse || !topicObj)) {
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

    /**
     * Reopens the topic named in the URL after a reload.
     *
     * A slug is not an id, so it has to be matched against titles. Whatever is already loaded is
     * searched first; failing that, resolveTopicIdBySlug fetches until it finds the topic. The
     * attempt is marked before any of it starts so a URL is only ever resolved once, and a URL
     * that resolves to nothing ends on the paths view - an unanswerable link used to leave the
     * study console spinning indefinitely.
     */
    useEffect(() => {
        if (!isLoggedIn || activeTopic || isStudyLoading) return;
        if (typeof window === 'undefined') return;

        const path = window.location.pathname;
        if (attemptedRestoreRef.current === path) return;

        const parts = path.split('/').filter(Boolean);
        if (parts.length < 3 || parts[0] !== 'paths') return;

        const pathSlug = parts[1];
        const topicSlug = parts[2];
        if (!topicSlug) return;

        attemptedRestoreRef.current = path;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topicSlug);
        if (isUuid) {
            if (String(activeTopicId) !== topicSlug) {
                handleSelectTopic(topicSlug);
            }
            return;
        }

        const loadedMatch = courses
            .flatMap(course => course.topics || [])
            .find(t => matchesSlug(t.title, topicSlug) || String(t.id) === topicSlug);

        if (loadedMatch) {
            if (String(activeTopicId) !== String(loadedMatch.id)) {
                handleSelectTopic(loadedMatch.id, undefined, undefined, true);
            }
            return;
        }

        if (!resolveTopicIdBySlug) return;

        let cancelled = false;
        (async () => {
            try {
                const resolved = await resolveTopicIdBySlug(pathSlug, topicSlug);
                if (cancelled) return;
                if (resolved !== null && String(activeTopicId) !== String(resolved)) {
                    handleSelectTopic(resolved, undefined, undefined, true);
                    return;
                }
                if (resolved === null) {
                    showToast("That topic could not be found", "error");
                    changeView('PATHS');
                }
            } catch (err) {
                if (cancelled) return;
                console.error("Failed to resolve the topic in the URL", err);
                showToast("Failed to open that topic", "error");
                changeView('PATHS');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        isLoggedIn,
        activeTopic,
        activeTopicId,
        courses,
        isStudyLoading,
        handleSelectTopic,
        resolveTopicIdBySlug,
        showToast,
        changeView
    ]);

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
