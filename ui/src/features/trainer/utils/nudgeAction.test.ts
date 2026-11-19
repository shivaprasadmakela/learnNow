import { describe, expect, it, vi } from 'vitest';
import { canRunNudgeAction, runNudgeAction, type NudgeHandlers } from './nudgeAction';
import type { NudgeAction, TrainerFeatures } from '../api/home.api';

const handlers = (): NudgeHandlers => ({
    openLesson: vi.fn(),
    startTopicInterview: vi.fn(),
    askAi: vi.fn(),
    openTrainer: vi.fn(),
    uploadResume: vi.fn(),
    mockInterview: vi.fn()
});

const allOn: TrainerFeatures = { askAi: true, topicInterview: true, mockInterview: true, resume: true, weeklyPlan: true };

const action = (over: Partial<NudgeAction>): NudgeAction => ({ type: 'open_trainer', label: 'Go', ...over });

describe('runNudgeAction', () => {
    it('opens the lesson a nudge names', () => {
        const h = handlers();
        expect(runNudgeAction(action({ type: 'open_lesson', topicId: 't-1', subtopicId: 's-2', pathId: 'p-1' }), h)).toBe(true);
        expect(h.openLesson).toHaveBeenCalledWith('t-1', 's-2');
    });

    it('opens the topic when the nudge has no lesson', () => {
        const h = handlers();
        runNudgeAction(action({ type: 'open_lesson', topicId: 't-1' }), h);
        expect(h.openLesson).toHaveBeenCalledWith('t-1', null);
    });

    it('starts a topic interview with the nudge title as the heading', () => {
        const h = handlers();
        runNudgeAction(action({ type: 'topic_interview', topicId: 't-1' }), h, 'Ready for Spring Core?');
        expect(h.startTopicInterview).toHaveBeenCalledWith('t-1', 'Ready for Spring Core?');
    });

    it('passes the ready prompt to Ask AI', () => {
        const h = handlers();
        runNudgeAction(action({ type: 'ask_ai', prompt: 'Explain joins again' }), h);
        expect(h.askAi).toHaveBeenCalledWith('Explain joins again');
    });

    it.each<[NudgeAction['type'], keyof NudgeHandlers]>([
        ['open_trainer', 'openTrainer'],
        ['upload_resume', 'uploadResume'],
        ['mock_interview', 'mockInterview']
    ])('maps %s to %s', (type, handler) => {
        const h = handlers();
        expect(runNudgeAction(action({ type }), h)).toBe(true);
        expect(h[handler]).toHaveBeenCalledTimes(1);
    });

    it('does nothing for a lesson or interview nudge without a topic, or an unknown type', () => {
        const h = handlers();
        expect(runNudgeAction(action({ type: 'open_lesson' }), h)).toBe(false);
        expect(runNudgeAction(action({ type: 'topic_interview' }), h)).toBe(false);
        expect(runNudgeAction(action({ type: 'something_new' as never }), h)).toBe(false);
        expect(Object.values(h).every(fn => (fn as ReturnType<typeof vi.fn>).mock.calls.length === 0)).toBe(true);
    });
});

describe('canRunNudgeAction', () => {
    it('hides buttons whose feature is switched off', () => {
        expect(canRunNudgeAction(action({ type: 'ask_ai' }), { ...allOn, askAi: false })).toBe(false);
        expect(canRunNudgeAction(action({ type: 'topic_interview', topicId: 't' }), { ...allOn, topicInterview: false })).toBe(false);
        expect(canRunNudgeAction(action({ type: 'upload_resume' }), { ...allOn, resume: false })).toBe(false);
        expect(canRunNudgeAction(action({ type: 'mock_interview' }), { ...allOn, mockInterview: false })).toBe(false);
    });

    it('shows them when the feature is on', () => {
        expect(canRunNudgeAction(action({ type: 'ask_ai' }), allOn)).toBe(true);
        expect(canRunNudgeAction(action({ type: 'topic_interview', topicId: 't' }), allOn)).toBe(true);
        expect(canRunNudgeAction(action({ type: 'open_trainer' }), allOn)).toBe(true);
    });

    it('needs a topic for lesson and interview nudges, and an action at all', () => {
        expect(canRunNudgeAction(action({ type: 'open_lesson' }), allOn)).toBe(false);
        expect(canRunNudgeAction(null, allOn)).toBe(false);
    });
});
