import { useState, useCallback, useEffect } from 'react';
import { fetchPaths, fetchPublicPaths } from '../../shared/api';
import type { Course } from '../../types';

export const useUserData = (isLoggedIn: boolean, activeView?: string, isAuthLoading = false) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState<boolean>(false);
    const [userStreak, setUserStreak] = useState<number>(0);
    const [userPoints, setUserPoints] = useState<number>(0);

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

        // If courses are already populated and not forcing refresh, skip duplicate API call
        if (courses.length > 0 && !force) {
            return;
        }

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
        } catch (err) {
            console.error("Failed to refresh user data", err);
        } finally {
            setIsCoursesLoading(false);
        }
    }, [isLoggedIn, activeView, isAuthLoading, courses.length]);

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
        refreshUserData
    };
};

export default useUserData;
