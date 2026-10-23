import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardResponse } from '../types';
import { fetchDashboard, peekDashboard } from '../api/dashboardApi';

/**
 * The dashboard's data. A fresh cached copy renders at once on remount; otherwise it is fetched.
 * The cache itself (see dashboardApi) decides what "fresh" means.
 */
export function useDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
        () => peekDashboard() ?? null
    );
    const [isLoading, setIsLoading] = useState<boolean>(() => peekDashboard() === undefined);
    const [error, setError] = useState<string | null>(null);

    const hasFetchedRef = useRef(false);

    const loadDashboard = useCallback(async (showLoading = true, force = false) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            const data = await fetchDashboard(force);
            setDashboardData(data);
        } catch (err: any) {
            console.error('Failed to load dashboard:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            // A cached copy is already on screen; only show the loader when there is none.
            loadDashboard(peekDashboard() === undefined);
        }
    }, [loadDashboard]);

    return {
        dashboardData,
        isLoading,
        error,
        refreshDashboard: () => {
            hasFetchedRef.current = true;
            loadDashboard(true, true);
        }
    };
}
