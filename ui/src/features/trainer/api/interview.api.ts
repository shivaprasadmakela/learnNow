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

export interface SpeakingHabits {
    wpm?: number;
    filler_words?: number;
    longest_pause_seconds?: number;
    average_answer_words?: number;
    turn_count?: number;
    total_words?: number;
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

export const saveInterviewNotes = (id: string, notes: { gap?: string; strength?: string }) =>
    apiFetchJson<void>(`/api/trainer/interviews/${encodeURIComponent(id)}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notes)
    });
