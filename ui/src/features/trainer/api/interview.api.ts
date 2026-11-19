import { apiFetchJson } from '../../../shared/api/client';
import { jsonBody, sendExpectingNoContent } from './http';

export interface InterviewAvailability {
    available: boolean;
    reason: string | null;
    left?: number;
    leftThisMonth?: number;
}

export type InterviewKind = 'TOPIC' | 'RETRY' | 'RESUME' | 'HR' | 'BEHAVIOURAL' | 'PROJECT' | 'FULL';

/** The kinds a learner can start from the mock interview cards. */
export type MockInterviewKind = 'RESUME' | 'HR' | 'BEHAVIOURAL' | 'PROJECT' | 'FULL';

export type InterviewStatus = 'CREATED' | 'COMPLETED' | 'SCORED' | 'FAILED' | 'ABANDONED';

/** Question categories as learnNow-ai writes them. */
export type QuestionCategory = 'intro' | 'technical' | 'project' | 'behavioural' | 'hr';

export interface StartInterviewResponse {
    interviewId: string;
    url: string;
    token: string;
    /** How long the agent will run the call; older servers leave it out. */
    maxSeconds?: number;
    kind?: InterviewKind;
}

// Field names as learnNow-ai's interview/habits.py returns them; the backend passes them through.
export interface SpeakingHabits {
    words_per_minute?: number;
    filler_words_count?: number;
    filler_words?: Record<string, number>;
    longest_pause_seconds?: number;
    average_words_per_answer?: number;
    total_user_words?: number;
    user_turns_count?: number;
}

/** What the scorer says about the whole interview. Passed through from learnNow-ai, so snake_case. */
export interface InterviewFeedback {
    dimensions: { accuracy: number; depth: number; structure: number; communication: number };
    strengths: string[];
    improvements: string[];
    next_step: string;
}

export interface AnswerFeedback {
    /** Null for questions the AI wrote rather than took from the question bank. */
    questionId: string | null;
    subtopicId: string | null;
    /** The question's id in the interview plan; what a retry is asked for. */
    planQuestionId?: string | null;
    category?: QuestionCategory | null;
    topicId?: string | null;
    prompt: string;
    score: number | null;
    good: string | null;
    missing: string | null;
    evidence: string | null;
    modelAnswer: string | null;
}

export interface InterviewTurn {
    seq: number;
    role: string;
    text: string;
    atSeconds: number;
    questionId: string | null;
}

export interface TopicInterviewReport {
    id: string;
    kind?: InterviewKind;
    title?: string | null;
    /** Null for mock interviews. */
    topicId: string | null;
    topicTitle: string | null;
    status: InterviewStatus;
    overallScore: number | null;
    habits: SpeakingHabits | null;
    /** Null for interviews scored before this was added. */
    feedback?: InterviewFeedback | null;
    learnerRating?: 1 | -1 | null;
    /** Set on a retry: the interview whose question was tried again. */
    parentInterviewId?: string | null;
    pointsAwarded: number;
    createdAt: string;
    completedAt: string | null;
    questions: AnswerFeedback[];
    turns: InterviewTurn[];
}

export interface TopicInterviewSummary {
    id: string;
    kind?: InterviewKind;
    title?: string | null;
    topicId: string | null;
    topicTitle: string | null;
    status: InterviewStatus;
    overallScore: number | null;
    pointsAwarded: number;
    createdAt: string;
}

export type InterviewReport = TopicInterviewReport;
export type InterviewSummary = TopicInterviewSummary;

export interface MockInterviewKindInfo {
    kind: MockInterviewKind;
    label: string;
    minutes: number;
    needsResume: boolean;
}

export interface MockInterviewAvailability {
    available: boolean;
    /** A code such as `mock_interview_quota_reached`, or null. */
    reason: string | null;
    left: number;
    hasResume: boolean;
    kinds: MockInterviewKindInfo[];
}

export const fetchInterviewAvailability = (topicId: string) =>
    apiFetchJson<InterviewAvailability>(`/api/trainer/interviews?topicId=${encodeURIComponent(topicId)}`);

export const startTopicInterview = (topicId: string) =>
    apiFetchJson<StartInterviewResponse>('/api/trainer/interviews', jsonBody('POST', { topicId }));

export const fetchTopicInterview = (id: string) =>
    apiFetchJson<TopicInterviewReport>(`/api/trainer/interviews/${encodeURIComponent(id)}`);

export const fetchTopicInterviews = () =>
    apiFetchJson<TopicInterviewSummary[]>('/api/trainer/interviews');

export const fetchMockAvailability = () =>
    apiFetchJson<MockInterviewAvailability>('/api/trainer/interviews/mock/availability');

/** Writes the interview plan and opens the room. Takes up to ~25 seconds. */
export const startMockInterview = (kind: MockInterviewKind, role: string | null, useJobDescription: boolean) =>
    apiFetchJson<StartInterviewResponse>(
        '/api/trainer/interviews/mock',
        jsonBody('POST', { kind, role: role || null, useJobDescription })
    );

/** One question from a scored interview, asked again by voice. */
export const retryInterviewQuestion = (interviewId: string, planQuestionId: string) =>
    apiFetchJson<StartInterviewResponse>(
        `/api/trainer/interviews/${encodeURIComponent(interviewId)}/retry`,
        jsonBody('POST', { questionId: planQuestionId })
    );

export const rateInterview = (interviewId: string, rating: 1 | -1, comment?: string) =>
    sendExpectingNoContent(
        `/api/trainer/interviews/${encodeURIComponent(interviewId)}/rating`,
        jsonBody('PUT', comment ? { rating, comment } : { rating }),
        'Could not save your rating.'
    );

const KIND_LABELS: Record<InterviewKind, string> = {
    TOPIC: 'Topic interview',
    RETRY: 'Retry',
    RESUME: 'Resume interview',
    HR: 'HR round',
    BEHAVIOURAL: 'Behavioural round',
    PROJECT: 'Project deep-dive',
    FULL: 'Full interview'
};

export const interviewKindLabel = (kind: InterviewKind | undefined | null) => KIND_LABELS[kind ?? 'TOPIC'] ?? 'Interview';

/** A history row or report's heading: its title, else the topic, else the kind. */
export const interviewTitle = (i: { title?: string | null; topicTitle?: string | null; kind?: InterviewKind }) =>
    i.title || i.topicTitle || interviewKindLabel(i.kind);
