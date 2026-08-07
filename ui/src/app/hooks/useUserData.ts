import { useState, useCallback, useEffect } from 'react';
import { fetchPaths, fetchPublicPaths } from '../../shared/api';
import type { Course } from '../../types';

export const useUserData = (isLoggedIn: boolean, activeView?: string) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [userStreak, setUserStreak] = useState<number>(0);
    const [userPoints, setUserPoints] = useState<number>(0);

    const refreshUserData = useCallback(async () => {
        // Skip fetching user courses/dashboard if the user is on standalone modules (Compiler, Auth)
        if (activeView === 'COMPILER' || activeView === 'LOGIN' || activeView === 'VERIFY_EMAIL') {
            return;
        }

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
        }
    }, [isLoggedIn, activeView]);

    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);

    const updateMetrics = useCallback((streak: number, points: number) => {
        setUserStreak(streak);
        setUserPoints(points);
    }, []);

    return {
        courses,
        userStreak,
        userPoints,
        updateMetrics,
        refreshUserData
    };
};

export default useUserData;
