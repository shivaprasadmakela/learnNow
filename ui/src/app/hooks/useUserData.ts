import { useState, useCallback, useEffect } from 'react';
import { fetchPaths, fetchPublicPaths } from '../../shared/api';
import { fetchDashboard } from '../../features/dashboard';
import type { Course } from '../../types';

export const useUserData = (isLoggedIn: boolean) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [userStreak, setUserStreak] = useState<number>(0);
    const [userPoints, setUserPoints] = useState<number>(0);

    const refreshUserData = useCallback(async () => {
        try {
            if (isLoggedIn) {
                const [fetchedPaths, dashboardData] = await Promise.all([
                    fetchPaths(),
                    fetchDashboard()
                ]);

                if (fetchedPaths) {
                    const mapped: Course[] = fetchedPaths.map(p => {
                        const summary = dashboardData?.paths?.find(dp => dp.id === p.id);
                        return {
                            id: p.id,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            duration: '10 hours',
                            level: 'Intermediate',
                            imageUrl: 'https://placeholder.co/ml',
                            managedBy: p.managedBy,
                            progressPercentage: summary ? summary.progressPercentage : 0,
                            topics: summary && summary.topics && summary.topics.length > 0
                                ? summary.topics.map(t => ({
                                    id: t.id,
                                    title: t.title,
                                    description: t.description,
                                    category: t.category,
                                    duration: t.duration,
                                    isCompleted: t.completed,
                                    progressPercentage: t.progressPercentage
                                }))
                                : p.topics
                        };
                    });
                    setCourses(mapped);
                }

                if (dashboardData) {
                    setUserStreak(dashboardData.currentStreak);
                    setUserPoints(dashboardData.totalPoints);
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
    }, [isLoggedIn]);

    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);

    return {
        courses,
        userStreak,
        userPoints,
        refreshUserData
    };
};

export default useUserData;
