import type { NudgeAction, TrainerFeatures } from '../api/home.api';

/** What each screen does for a nudge's button. The trainer page and the dashboard card differ. */
export interface NudgeHandlers {
    openLesson: (topicId: string, subtopicId: string | null) => void;
    startTopicInterview: (topicId: string, title: string) => void;
    askAi: (prompt: string | null) => void;
    openTrainer: () => void;
    uploadResume: () => void;
    mockInterview: () => void;
}

/**
 * Whether a nudge's button can be shown: its feature must be switched on, and it must carry what
 * it needs (a topic to open). A nudge whose action cannot run still shows its text.
 */
export const canRunNudgeAction = (action: NudgeAction | null | undefined, features: TrainerFeatures | null | undefined) => {
    if (!action) return false;
    switch (action.type) {
        case 'open_lesson':
            return Boolean(action.topicId);
        case 'topic_interview':
            return Boolean(action.topicId) && features?.topicInterview !== false;
        case 'ask_ai':
            return features?.askAi !== false;
        case 'upload_resume':
            return features?.resume !== false;
        case 'mock_interview':
            return features?.mockInterview !== false;
        case 'open_trainer':
            return true;
        default:
            return false;
    }
};

/** Runs a nudge's action. Returns false when it names something this client does not know. */
export const runNudgeAction = (action: NudgeAction, handlers: NudgeHandlers, title = ''): boolean => {
    switch (action.type) {
        case 'open_lesson':
            if (!action.topicId) return false;
            handlers.openLesson(action.topicId, action.subtopicId ?? null);
            return true;
        case 'topic_interview':
            if (!action.topicId) return false;
            handlers.startTopicInterview(action.topicId, title);
            return true;
        case 'ask_ai':
            handlers.askAi(action.prompt ?? null);
            return true;
        case 'open_trainer':
            handlers.openTrainer();
            return true;
        case 'upload_resume':
            handlers.uploadResume();
            return true;
        case 'mock_interview':
            handlers.mockInterview();
            return true;
        default:
            return false;
    }
};
