import { apiFetch } from '../../../shared/api/client';
import type { DashboardResponse } from '../types';

export const fetchDashboard = async (): Promise<DashboardResponse> => {
    const response = await apiFetch('/api/me/dashboard');
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
};
