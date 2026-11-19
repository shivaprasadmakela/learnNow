import { apiFetchJson } from '../../../shared/api/client';
import { fetchJsonOrNull } from './http';
import type { PlanTask } from './home.api';

/** The weekly study plan. Its contents come from learnNow-ai as they are, so they keep snake_case. */

export type PlanDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface WeeklyPlanContent {
    headline: string;
    focus: string[];
    days: { day: PlanDay; tasks: PlanTask[] }[];
    advice: string[];
    total_minutes: number;
}

export interface WeeklyPlan {
    /** The Monday the plan starts, "YYYY-MM-DD". */
    weekStart: string;
    generatedAt: string;
    refreshesLeft: number;
    plan: WeeklyPlanContent;
}

/** This week's plan, or null when none has been made yet. */
export const fetchWeeklyPlan = () => fetchJsonOrNull<WeeklyPlan>('/api/trainer/plan');

/** Writes (or rewrites) this week's plan. Takes a few seconds. */
export const generateWeeklyPlan = () => apiFetchJson<WeeklyPlan>('/api/trainer/plan', { method: 'POST' });
