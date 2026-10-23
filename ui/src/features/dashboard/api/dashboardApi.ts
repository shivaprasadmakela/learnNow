import { apiFetch } from '../../../shared/api/client';
import { cachedResource } from '../../../shared/api/cache';
import type { DashboardResponse } from '../types';

/**
 * Held for half a minute, so going to a lesson and straight back does not refetch it. Anything
 * that changes progress or points calls `progressChanged()`, which drops it at once.
 */
const dashboard = cachedResource(
    async (): Promise<DashboardResponse> => {
        const response = await apiFetch('/api/me/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return response.json();
    },
    { maxAgeMs: 30_000, resetOnProgress: true }
);

export const fetchDashboard = (force: boolean = false): Promise<DashboardResponse> =>
    dashboard.get(force);

/** The cached dashboard if it is still fresh, so a remount can render without a loader. */
export const peekDashboard = (): DashboardResponse | undefined => dashboard.peek();

export const invalidateDashboardCache = (): void => dashboard.invalidate();
