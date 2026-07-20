import { useState, useEffect, useCallback } from 'react';
import type { DashboardResponse } from '../types';
import { fetchDashboard } from '../api/dashboardApi';

export function useDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboard = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            const data = await fetchDashboard();
            setDashboardData(data);
        } catch (err: any) {
            console.error('Failed to load dashboard:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard(true);
    }, [loadDashboard]);

    return {
        dashboardData,
        isLoading,
        error,
        refreshDashboard: () => loadDashboard(true)
    };
}
