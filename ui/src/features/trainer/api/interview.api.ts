import { apiFetchJson } from '../../../shared/api/client';

export interface InterviewAvailability {
    available: boolean;
    reason: string | null;
    left?: number;
    leftThisMonth?: number;
}

export interface StartInterviewResponse {
    interviewId: string;
    url: string;
    token: string;
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

export interface AnswerFeedback {
    questionId: string | null;
    subtopicId: string | null;
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
    topicId: string;
    topicTitle: string;
    status: 'CREATED' | 'COMPLETED' | 'SCORED' | 'FAILED' | 'ABANDONED';
    overallScore: number | null;
    habits: SpeakingHabits | null;
    pointsAwarded: number;
    createdAt: string;
    completedAt: string | null;
    questions: AnswerFeedback[];
    turns: InterviewTurn[];
}

export interface TopicInterviewSummary {
    id: string;
    topicId: string;
    topicTitle: string;
    status: 'CREATED' | 'COMPLETED' | 'SCORED' | 'FAILED' | 'ABANDONED';
    overallScore: number | null;
    pointsAwarded: number;
    createdAt: string;
}

export const fetchInterviewAvailability = (topicId: string) =>
    apiFetchJson<InterviewAvailability>(`/api/trainer/interviews?topicId=${encodeURIComponent(topicId)}`);

export const startTopicInterview = (topicId: string) =>
    apiFetchJson<StartInterviewResponse>('/api/trainer/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId })
    });

export const fetchTopicInterview = (id: string) =>
    apiFetchJson<TopicInterviewReport>(`/api/trainer/interviews/${encodeURIComponent(id)}`);

export const fetchTopicInterviews = () =>
    apiFetchJson<TopicInterviewSummary[]>('/api/trainer/interviews');
