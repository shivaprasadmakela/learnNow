import { useSyncExternalStore } from 'react';
import type { TrainerPage } from './api/trainer.api';

/**
 * Where the learner is, so "explain this" means the lesson on screen. Screens set it as they
 * show content; Ask AI reads it when a message is sent.
 */
let page: TrainerPage | null = null;
let quizInProgress = false;
let interviewActive = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());

export const setTrainerPage = (next: TrainerPage | null) => {
    page = next;
    emit();
};

/** True while a lesson quiz has unanswered questions on screen; Ask AI then won't give answers away. */
export const setQuizInProgress = (value: boolean) => {
    quizInProgress = value;
    emit();
};

export const setInterviewActive = (value: boolean) => {
    interviewActive = value;
    emit();
};

export const getTrainerContext = () => ({ page, quizInProgress, interviewActive });

export const isInterviewActive = () => interviewActive;

export const useInterviewActive = () =>
    useSyncExternalStore(
        l => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => interviewActive
    );

/**
 * A request from another screen to open Ask AI, with a ready prompt when there is one: a nudge's
 * "Ask AI", or a weak topic on the trainer page. Ask AI takes it once and clears it, so remounting
 * the panel does not send the same prompt twice.
 */
export interface AskAiRequest {
    id: number;
    prompt: string | null;
}

let askAiRequest: AskAiRequest | null = null;
let askAiSeq = 0;

export const openAskAi = (prompt?: string | null) => {
    askAiRequest = { id: ++askAiSeq, prompt: prompt?.trim() || null };
    emit();
};

export const takeAskAiRequest = (): AskAiRequest | null => {
    const request = askAiRequest;
    askAiRequest = null;
    if (request) emit();
    return request;
};

export const useAskAiRequest = () =>
    useSyncExternalStore(
        l => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => askAiRequest
    );

export const useTrainerPage = () =>
    useSyncExternalStore(
        l => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => page
    );
