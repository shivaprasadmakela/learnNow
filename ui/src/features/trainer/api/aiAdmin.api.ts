import { apiFetchJson } from '../../../shared/api/client';
import { jsonBody, sendExpectingNoContent } from './http';
import type { InterviewKind, InterviewStatus } from './interview.api';

/** The admin AI page: spend against the cap, feature switches, interview counts, flagged reports. */

export type AiFeature = 'ASK_AI' | 'TOPIC_INTERVIEW' | 'MOCK_INTERVIEW' | 'RESUME' | 'WEEKLY_PLAN';

export const AI_FEATURES: AiFeature[] = ['ASK_AI', 'TOPIC_INTERVIEW', 'MOCK_INTERVIEW', 'RESUME', 'WEEKLY_PLAN'];

export interface AiFeatureFlag {
    feature: AiFeature;
    enabled: boolean;
    updatedAt: string | null;
}

/** learnNow-ai's own usage report, passed through, so it keeps snake_case. */
export interface AiUsage {
    tenant: string;
    month: string;
    cap_inr: number;
    spent_inr: number;
    by_feature: { feature: string; provider: string; calls: number; cost_inr: number }[];
    daily: { day: string; calls: number; cost_inr: number }[];
}

export interface FlaggedEvaluation {
    id: string;
    kind: InterviewKind;
    title: string | null;
    overallScore: number | null;
    comment: string | null;
    createdAt: string;
}

export interface AiAdminOverview {
    flags: AiFeatureFlag[];
    /** Null when learnNow-ai could not be reached. */
    usage: AiUsage | null;
    interviews: { thisMonth: Partial<Record<InterviewKind, Partial<Record<InterviewStatus, number>>>> };
    flagged: FlaggedEvaluation[];
    quotas: { topicInterviews: number; mockInterviews: number; resumeAnalyses: number };
}

export const fetchAiAdmin = () => apiFetchJson<AiAdminOverview>('/api/admin/ai');

export const setAiFeatureEnabled = (feature: AiFeature, enabled: boolean) =>
    sendExpectingNoContent(
        `/api/admin/ai/flags/${encodeURIComponent(feature)}`,
        jsonBody('PUT', { enabled }),
        'Could not change the switch.'
    );
