import { useState, useCallback, useEffect, useRef } from 'react';
import {
    DEFAULT_PAGE_SIZE,
    fetchPathsPage,
    fetchPublicPathsPage,
    fetchTopicsByPathPage
} from '../../shared/api';
import type { Course, PathData } from '../../types';
import type { Topic } from '../../features/topics';
import { matchesSlug } from '../../shared/utils/slug';

interface TopicPaging {
    /** Highest topic page loaded for this path so far. */
    page: number;
    hasNext: boolean;
    isLoading: boolean;
}

const normaliseTopics = (rawTopics: Topic[] | undefined): Topic[] =>
    (rawTopics || []).map(t => ({
        ...t,
        progressPercentage: t.isCompleted ? 100 : (t.progressPercentage || 0)
    }));

const averageProgress = (topics: Topic[], fallback: number) =>
    topics.length > 0
        ? Math.round(
              topics.reduce(
                  (acc, t) => acc + (t.isCompleted ? 100 : (t.progressPercentage || 0)),
                  0
              ) / topics.length
          )
        : fallback;

const toCourse = (p: PathData, isLoggedIn: boolean): Course => {
    const topics = normaliseTopics(p.topics);
    return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        duration: '10 hours',
        level: 'Intermediate',
        imageUrl: 'https://placeholder.co/ml',
        managedBy: p.managedBy,
        progressPercentage: isLoggedIn
            ? (p.progressPercentage || averageProgress(topics, 0))
            : 0,
        topicCount: typeof p.topicCount === 'number' ? p.topicCount : topics.length,
        topics
    };
};

const mergeCourses = (existing: Course[], incoming: Course[]): Course[] => {
    const seen = new Set(existing.map(c => String(c.id)));
    return [...existing, ...incoming.filter(c => !seen.has(String(c.id)))];
};

export const useUserData = (isLoggedIn: boolean, activeView?: string, isAuthLoading = false) => {
    const [courses, setCourses] = useState<Course[]>([]);
    // Mirrors courses for callers that read them outside a render, so slug resolution does not
    // have to be rebuilt - and restarted - every time a page of paths or topics arrives.
    const coursesRef = useRef<Course[]>([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState<boolean>(false);
    /**
     * null means "not reported yet", which is deliberately distinct from 0. The header used to
     * read the profile's gemsCount first, and that value is captured at login and never
     * refreshed - so a genuine 0 from sign-in time shadowed the live figure through ?? and the
     * gem count never moved, even while the leaderboard climbed.
     */
    const [userStreak, setUserStreak] = useState<number | null>(null);
    const [userPoints, setUserPoints] = useState<number | null>(null);

    /**
     * Paths arrive one page at a time and the Paths grid asks for the next as it scrolls, so the
     * page cursor lives in a ref: the loader reads it while running, and re-rendering on every
     * appended page must not hand a stale cursor to an in-flight request.
     */
    const pathsPageRef = useRef(0);
    const [hasMorePaths, setHasMorePaths] = useState(false);
    const [isLoadingMorePaths, setIsLoadingMorePaths] = useState(false);
    const isLoadingMorePathsRef = useRef(false);

    /** Per-path topic cursors, keyed by path id. */
    const [topicPaging, setTopicPaging] = useState<Record<string, TopicPaging>>({});
    const topicPagingRef = useRef<Record<string, TopicPaging>>({});
    const setTopicPagingFor = useCallback((pathId: string, next: TopicPaging) => {
        topicPagingRef.current = { ...topicPagingRef.current, [pathId]: next };
        setTopicPaging(topicPagingRef.current);
    }, []);

    /**
     * Records how far into each path's topics the embedded first page already reaches.
     *
     * The path payload carries both its first page of topics and the total count, so the topic
     * list knows to keep scrolling without a probe request. Seeding here rather than on selection
     * also covers arriving straight at /paths/:slug, where nothing calls loadTopicsForPath.
     */
    const seedTopicPaging = useCallback((incoming: Course[]) => {
        const seeded = { ...topicPagingRef.current };
        for (const course of incoming) {
            const key = String(course.id);
            if (seeded[key]) continue;
            const loaded = course.topics?.length || 0;
            seeded[key] = {
                page: 0,
                hasNext: (course.topicCount || 0) > loaded,
                isLoading: false
            };
        }
        topicPagingRef.current = seeded;
        setTopicPaging(seeded);
    }, []);

    useEffect(() => {
        coursesRef.current = courses;
    }, [courses]);

    const isFetchingRef = useRef(false);
    const hasFetchedRef = useRef(false);
    const prevAuthRef = useRef<boolean>(isLoggedIn);

    // Reset fetch status if login status changes
    useEffect(() => {
        if (prevAuthRef.current !== isLoggedIn) {
            hasFetchedRef.current = false;
            prevAuthRef.current = isLoggedIn;
        }
    }, [isLoggedIn]);

    /** Merges a freshly loaded page of topics into the path it belongs to. */
    const applyTopicsPage = useCallback((pathId: number | string, rawTopics: Topic[], replace: boolean) => {
        const topics = normaliseTopics(rawTopics);
        setCourses(prev => prev.map(c => {
            if (String(c.id) !== String(pathId)) return c;
            const existing = replace ? [] : (c.topics || []);
            const seen = new Set(existing.map(t => String(t.id)));
            const merged = [...existing, ...topics.filter(t => !seen.has(String(t.id)))];
            return {
                ...c,
                topics: merged,
                progressPercentage: averageProgress(merged, c.progressPercentage || 0)
            };
        }));
    }, []);

    /**
     * Loads the first page of a path's topics. Later pages come from loadMoreTopicsForPath as the
     * topic list scrolls, so opening a path with a hundred topics costs one small request.
     */
    const loadTopicsForPath = useCallback(async (pathId: number | string) => {
        const key = String(pathId);
        const current = topicPagingRef.current[key];
        if (current?.isLoading) return;
        setTopicPagingFor(key, { page: 0, hasNext: current?.hasNext ?? false, isLoading: true });
        try {
            const result = await fetchTopicsByPathPage(pathId, 0, DEFAULT_PAGE_SIZE);
            applyTopicsPage(pathId, result.content, true);
            setTopicPagingFor(key, { page: 0, hasNext: result.hasNext, isLoading: false });
        } catch (err) {
            console.error("Failed to load topics for path", err);
            setTopicPagingFor(key, { page: 0, hasNext: false, isLoading: false });
        }
    }, [applyTopicsPage, setTopicPagingFor]);

    const loadMoreTopicsForPath = useCallback(async (pathId: number | string) => {
        const key = String(pathId);
        const current = topicPagingRef.current[key];
        if (!current || current.isLoading || !current.hasNext) return;

        const nextPage = current.page + 1;
        setTopicPagingFor(key, { ...current, isLoading: true });
        try {
            const result = await fetchTopicsByPathPage(pathId, nextPage, DEFAULT_PAGE_SIZE);
            applyTopicsPage(pathId, result.content, false);
            setTopicPagingFor(key, { page: nextPage, hasNext: result.hasNext, isLoading: false });
        } catch (err) {
            console.error("Failed to load more topics for path", err);
            setTopicPagingFor(key, { ...current, isLoading: false });
        }
    }, [applyTopicsPage, setTopicPagingFor]);

    const refreshUserData = useCallback(async (force = false) => {
        // Wait for initial auth profile check to settle before fetching paths
        if (isAuthLoading) {
            return;
        }

        // Fetch paths ONLY when the user views Home, Paths, Topics, or Study views
        // STUDY is deliberately absent. The study console renders one topic, fetched by
        // its own endpoint; it never shows the path list, so pulling every path and all
        // their topics there was a large request for data nothing displayed.
        const shouldFetchPaths =
            activeView === 'HOME' || activeView === 'PATHS' || activeView === 'TOPICS';
        if (!shouldFetchPaths && !force) {
            return;
        }

        // If paths are already successfully fetched and not forcing, skip duplicate API call
        if (hasFetchedRef.current && !force) {
            return;
        }

        // Prevent concurrent duplicate fetch calls
        if (isFetchingRef.current && !force) {
            return;
        }

        isFetchingRef.current = true;
        setIsCoursesLoading(true);
        try {
            const result = isLoggedIn
                ? await fetchPathsPage(0, DEFAULT_PAGE_SIZE, force)
                : await fetchPublicPathsPage(0, DEFAULT_PAGE_SIZE);

            const mapped = result.content.map(p => toCourse(p, isLoggedIn));
            setCourses(mapped);
            pathsPageRef.current = 0;
            setHasMorePaths(result.hasNext);
            // Topic cursors describe the previous page of paths; a reload invalidates them.
            topicPagingRef.current = {};
            seedTopicPaging(mapped);
            hasFetchedRef.current = true;
        } catch (err) {
            console.error("Failed to refresh user data", err);
            hasFetchedRef.current = true; // Mark attempted to avoid infinite retry loops on error
        } finally {
            isFetchingRef.current = false;
            setIsCoursesLoading(false);
        }
    }, [isLoggedIn, activeView, isAuthLoading, seedTopicPaging]);

    /** Appends the next page of paths. Driven by the Paths grid scrolling to its end. */
    const loadMorePaths = useCallback(async () => {
        if (isLoadingMorePathsRef.current || isFetchingRef.current || !hasMorePaths) return;

        isLoadingMorePathsRef.current = true;
        setIsLoadingMorePaths(true);
        const nextPage = pathsPageRef.current + 1;
        try {
            const result = isLoggedIn
                ? await fetchPathsPage(nextPage, DEFAULT_PAGE_SIZE)
                : await fetchPublicPathsPage(nextPage, DEFAULT_PAGE_SIZE);

            const mapped = result.content.map(p => toCourse(p, isLoggedIn));
            setCourses(prev => mergeCourses(prev, mapped));
            seedTopicPaging(mapped);
            pathsPageRef.current = nextPage;
            setHasMorePaths(result.hasNext);
        } catch (err) {
            console.error("Failed to load more paths", err);
            setHasMorePaths(false);
        } finally {
            isLoadingMorePathsRef.current = false;
            setIsLoadingMorePaths(false);
        }
    }, [hasMorePaths, isLoggedIn, seedTopicPaging]);

    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);

    /**
     * Marks the cached path list as stale without fetching anything.
     *
     * Completing a section changes progress percentages shown on the Paths and Topics views,
     * but not in the study console the user is currently looking at. Forcing a refetch there
     * meant waiting on the full path payload - and a second call for the same path's topics -
     * before the toast appeared. Marking it stale defers that to whichever view actually needs
     * it, which then fetches once.
     */
    const markPathsStale = useCallback(() => {
        hasFetchedRef.current = false;
    }, []);

    const updateMetrics = useCallback((streak: number, points: number) => {
        setUserStreak(streak);
        setUserPoints(points);
    }, []);

    /** Whether a given path still has topics the client has not fetched. */
    const getTopicPaging = useCallback((pathId: number | string | null | undefined): TopicPaging => {
        if (pathId === null || pathId === undefined) {
            return { page: 0, hasNext: false, isLoading: false };
        }
        return topicPaging[String(pathId)] || { page: 0, hasNext: false, isLoading: false };
    }, [topicPaging]);

    /**
     * Resolves a /paths/:pathSlug/:topicSlug URL to a topic id, fetching what it takes.
     *
     * Landing straight on a study URL is the one case where neither half of that URL is in
     * memory: the study console does not fetch the path list (it shows none), and topics arrive
     * a page at a time, so a link to the thirtieth topic names something three pages past
     * anything loaded. This walks pages until it finds the topic, merging each one so the
     * console's next-topic link keeps working, and returns null rather than leaving the caller
     * waiting on data that is never coming.
     */
    const resolveTopicIdBySlug = useCallback(
        async (pathSlug: string, topicSlug: string): Promise<string | number | null> => {
            const findPath = (list: Course[]) =>
                list.find(
                    c => matchesSlug(c.title, pathSlug) || String(c.id) === pathSlug
                );

            let path = findPath(coursesRef.current);
            let pathPage = pathsPageRef.current;
            let morePaths = !path;

            while (!path && morePaths) {
                const result = isLoggedIn
                    ? await fetchPathsPage(pathPage, DEFAULT_PAGE_SIZE)
                    : await fetchPublicPathsPage(pathPage, DEFAULT_PAGE_SIZE);
                const mapped = result.content.map(p => toCourse(p, isLoggedIn));
                setCourses(prev => mergeCourses(prev, mapped));
                seedTopicPaging(mapped);
                pathsPageRef.current = pathPage;
                setHasMorePaths(result.hasNext);
                path = findPath(mapped);
                morePaths = result.hasNext;
                pathPage += 1;
            }

            if (!path) return null;

            const loaded = path.topics || [];
            const alreadyLoaded = loaded.find(
                t => matchesSlug(t.title, topicSlug) || String(t.id) === topicSlug
            );
            if (alreadyLoaded) return alreadyLoaded.id;

            let topicPage = 0;
            let moreTopics = true;
            while (moreTopics) {
                const result = await fetchTopicsByPathPage(path.id, topicPage, DEFAULT_PAGE_SIZE);
                applyTopicsPage(path.id, result.content, topicPage === 0);
                setTopicPagingFor(String(path.id), {
                    page: topicPage,
                    hasNext: result.hasNext,
                    isLoading: false
                });
                const match = result.content.find(
                    t => matchesSlug(t.title, topicSlug) || String(t.id) === topicSlug
                );
                if (match) return match.id;
                moreTopics = result.hasNext;
                topicPage += 1;
            }

            return null;
        },
        [isLoggedIn, seedTopicPaging, applyTopicsPage, setTopicPagingFor]
    );

    return {
        courses,
        isCoursesLoading,
        hasMorePaths,
        isLoadingMorePaths,
        loadMorePaths,
        userStreak,
        userPoints,
        updateMetrics,
        markPathsStale,
        refreshUserData,
        loadTopicsForPath,
        loadMoreTopicsForPath,
        getTopicPaging,
        resolveTopicIdBySlug
    };
};

export default useUserData;
