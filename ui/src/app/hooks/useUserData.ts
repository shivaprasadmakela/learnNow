import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchPaths, fetchPublicPaths, fetchTopicsByPath } from '../../shared/api';
import type { Course } from '../../types';

export const useUserData = (isLoggedIn: boolean, activeView?: string, isAuthLoading = false) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState<boolean>(false);
    /**
     * null means "not reported yet", which is deliberately distinct from 0. The header used to
     * read the profile's gemsCount first, and that value is captured at login and never
     * refreshed - so a genuine 0 from sign-in time shadowed the live figure through ?? and the
     * gem count never moved, even while the leaderboard climbed.
     */
    const [userStreak, setUserStreak] = useState<number | null>(null);
    const [userPoints, setUserPoints] = useState<number | null>(null);

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

    const loadTopicsForPath = useCallback(async (pathId: number | string) => {
        try {
            const rawTopics = await fetchTopicsByPath(pathId);
            if (rawTopics) {
                const topics = rawTopics.map((t: any) => ({
                    ...t,
                    progressPercentage: t.isCompleted ? 100 : (t.progressPercentage || 0)
                }));
                setCourses(prev => prev.map(c => {
                    if (String(c.id) === String(pathId)) {
                        const pathPct = topics.length > 0
                            ? Math.round(topics.reduce((acc: number, t: any) => acc + (t.isCompleted ? 100 : (t.progressPercentage || 0)), 0) / topics.length)
                            : (c.progressPercentage || 0);
                        return { ...c, topics, progressPercentage: pathPct };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error("Failed to load topics for path", err);
        }
    }, []);

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
            if (isLoggedIn) {
                const fetchedPaths = await fetchPaths(force);

                if (fetchedPaths) {
                    const mapped: Course[] = fetchedPaths.map(p => {
                        const topics = (p.topics || []).map((t: any) => ({
                            ...t,
                            progressPercentage: t.isCompleted ? 100 : (t.progressPercentage || 0)
                        }));
                        const calculatedPathPct = p.progressPercentage || (
                            topics.length > 0
                                ? Math.round(topics.reduce((acc: number, t: any) => acc + (t.isCompleted ? 100 : (t.progressPercentage || 0)), 0) / topics.length)
                                : 0
                        );
                        return {
                            id: p.id,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            duration: '10 hours',
                            level: 'Intermediate',
                            imageUrl: 'https://placeholder.co/ml',
                            managedBy: p.managedBy,
                            progressPercentage: calculatedPathPct,
                            topics: topics
                        };
                    });
                    setCourses(mapped);
                }
            } else {
                const publicPaths = await fetchPublicPaths();
                if (publicPaths) {
                    const mapped: Course[] = publicPaths.map(p => ({
                        id: p.id,
                        title: p.title,
                        description: p.description,
                        category: p.category,
                        duration: '10 hours',
                        level: 'Intermediate',
                        imageUrl: 'https://placeholder.co/ml',
                        managedBy: p.managedBy,
                        progressPercentage: 0,
                        topics: p.topics
                    }));
                    setCourses(mapped);
                }
            }
            hasFetchedRef.current = true;
        } catch (err) {
            console.error("Failed to refresh user data", err);
            hasFetchedRef.current = true; // Mark attempted to avoid infinite retry loops on error
        } finally {
            isFetchingRef.current = false;
            setIsCoursesLoading(false);
        }
    }, [isLoggedIn, activeView, isAuthLoading]);

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

    return {
        courses,
        isCoursesLoading,
        userStreak,
        userPoints,
        updateMetrics,
        markPathsStale,
        refreshUserData,
        loadTopicsForPath
    };
};

export default useUserData;
