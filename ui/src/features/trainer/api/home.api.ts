import { apiFetchJson } from '../../../shared/api/client';
import type { TrainerGoal } from './trainer.api';
import type { TopicInterviewSummary } from './interview.api';

/** The trainer home: what to do today, how ready the learner is, and what is left this month. */

export type ReadinessLevel = 'strong' | 'okay' | 'weak' | 'untested';

export interface TopicReadiness {
    topicId: string;
    topicTitle: string;
    pathId: string | null;
    completed: boolean;
    quizAnswered: number;
    /** 0-100, or null below the minimum number of answers. */
    quizAccuracy: number | null;
    interviewScore: number | null;
    interviewsTaken: number;
    readiness: number | null;
    level: ReadinessLevel;
}

export type TaskKind = 'lesson' | 'quiz' | 'interview' | 'revise' | 'resume' | 'practice';

export interface PlanTask {
    kind: TaskKind;
    title: string;
    topic: string | null;
    minutes: number;
}

export type NudgeKind =
    | 'streak_risk'
    | 'interview_ready'
    | 'weak_topic'
    | 'quiz_mistakes'
    | 'comeback'
    | 'set_goal'
    | 'upload_resume';

export type NudgeActionType =
    | 'open_lesson'
    | 'topic_interview'
    | 'ask_ai'
    | 'open_trainer'
    | 'upload_resume'
    | 'mock_interview';

export interface NudgeAction {
    type: NudgeActionType;
    label: string;
    topicId?: string | null;
    subtopicId?: string | null;
    pathId?: string | null;
    prompt?: string | null;
}

export interface Nudge {
    kind: NudgeKind;
    title: string;
    body: string;
    action: NudgeAction | null;
}

export interface TrainerFeatures {
    askAi: boolean;
    topicInterview: boolean;
    mockInterview: boolean;
    resume: boolean;
    weeklyPlan: boolean;
}

export interface TrainerQuotas {
    topicInterviewsLeft: number;
    mockInterviewsLeft: number;
    resumeAnalysesLeft: number;
    retriesLeftToday: number;
    planRefreshesLeft: number;
}

export interface TrainerHome {
    /** False when the AI service is not configured; the trainer is then hidden. */
    available: boolean;
    /** False without the PERSONALISATION consent: no nudges, readiness or today's tasks then. */
    personalised: boolean;
    features: TrainerFeatures;
    goal: TrainerGoal | null;
    streak: { currentDays: number; studiedToday: boolean };
    todayTasks: PlanTask[];
    nudges: Nudge[];
    readiness: { weakest: TopicReadiness[]; untested: TopicReadiness[] };
    quotas: TrainerQuotas;
    resume: { present: boolean; overall: number | null; targetRole: string | null } | null;
    recentInterviews: TopicInterviewSummary[];
}

export const fetchTrainerHome = () => apiFetchJson<TrainerHome>('/api/trainer/home');

/** Every topic the learner has touched, weakest first. */
export const fetchReadiness = () => apiFetchJson<TopicReadiness[]>('/api/trainer/readiness');
