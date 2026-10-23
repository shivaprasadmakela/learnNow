import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { InterviewBank } from './InterviewBank';
import type { InterviewQuestion, InterviewTopic } from '../../api/interview.api';
import * as api from '../../api/interview.api';

vi.mock('../../api/interview.api', () => ({
    fetchPathInterviewTopics: vi.fn(),
    fetchTopicInterviewQuestions: vi.fn(),
    fetchInterviewAnswer: vi.fn()
}));

const PATH = '00000000-0000-4000-8000-000000000001';
const METHODS = '00000000-0000-4000-8000-0000000000a1';
const COLLECTIONS = '00000000-0000-4000-8000-0000000000a2';

const q = (id: string, prompt: string): InterviewQuestion => ({
    id,
    prompt,
    depth: 1,
    practice: true,
    sightings: [],
    followUpCount: 0
});

const topics: InterviewTopic[] = [
    { topicId: METHODS, topicTitle: 'Methods', questionCount: 1, followUpCount: 0 },
    { topicId: COLLECTIONS, topicTitle: 'Collections', questionCount: 2, followUpCount: 0 }
];

const questionsByTopic: Record<string, InterviewQuestion[]> = {
    [METHODS]: [q('a', 'Is Java pass-by-value or pass-by-reference?')],
    [COLLECTIONS]: [q('b', 'How does a HashMap store an entry?'), q('c', 'When would you use LinkedList?')]
};

beforeEach(() => {
    vi.mocked(api.fetchPathInterviewTopics).mockReset().mockResolvedValue(topics);
    vi.mocked(api.fetchTopicInterviewQuestions)
        .mockReset()
        .mockImplementation(id => Promise.resolve(questionsByTopic[id]));
});

describe('InterviewBank', () => {
    it('explains how it works and lists the topics with their question counts', async () => {
        render(<InterviewBank pathId={PATH} />);

        expect(await screen.findByText('Answer out loud, then reveal')).toBeTruthy();
        const nav = screen.getByRole('navigation', { name: 'Interview topics' });
        expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(['Methods1', 'Collections2']);
    });

    it('fetches only the open topic, and the next one when it is chosen', async () => {
        render(<InterviewBank pathId={PATH} />);

        expect(await screen.findByText('Is Java pass-by-value or pass-by-reference?')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Methods' })).toBeTruthy();
        expect(api.fetchTopicInterviewQuestions).toHaveBeenCalledTimes(1);
        expect(api.fetchTopicInterviewQuestions).toHaveBeenCalledWith(METHODS);

        fireEvent.click(screen.getByRole('button', { name: /Collections/ }));

        expect(await screen.findByText('Q2')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Collections' })).toBeTruthy();
        expect(screen.getByText('2 questions')).toBeTruthy();
        expect(screen.queryByText('Is Java pass-by-value or pass-by-reference?')).toBeNull();
        expect(screen.getByRole('button', { name: /Collections/ }).getAttribute('aria-current')).toBe('true');
        expect(api.fetchTopicInterviewQuestions).toHaveBeenLastCalledWith(COLLECTIONS);
        // No answer is fetched until one is revealed.
        expect(api.fetchInterviewAnswer).not.toHaveBeenCalled();
    });
});
