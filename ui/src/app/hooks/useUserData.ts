import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchPaths, fetchPublicPaths, fetchTopicsByPath } from '../../shared/api';
import type { Course } from '../../types';

export const useUserData = (isLoggedIn: boolean, activeView?: string, isAuthLoading = false) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState<boolean>(false);
    const [userStreak, setUserStreak] = useState<number>(0);
    const [userPoints, setUserPoints] = useState<number>(0);

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
            const topics = await fetchTopicsByPath(pathId);
            if (topics) {
                setCourses(prev => prev.map(c => String(c.id) === String(pathId) ? { ...c, topics } : c));
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
        const shouldFetchPaths = activeView === 'HOME' || activeView === 'PATHS' || activeView === 'TOPICS' || activeView === 'STUDY';
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
                const fetchedPaths = await fetchPaths();

                if (fetchedPaths) {
                    const mapped: Course[] = fetchedPaths.map(p => ({
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
        refreshUserData,
        loadTopicsForPath
    };
};

export default useUserData;
