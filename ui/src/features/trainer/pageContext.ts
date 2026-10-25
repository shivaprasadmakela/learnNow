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

export const useTrainerPage = () =>
    useSyncExternalStore(
        l => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => page
    );
