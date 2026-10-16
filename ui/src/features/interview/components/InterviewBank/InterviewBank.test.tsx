import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { InterviewBank } from './InterviewBank';
import type { InterviewQuestion, InterviewTopic } from '../../api/interview.api';

const q = (id: string, prompt: string): InterviewQuestion => ({
    id,
    prompt,
    answerShort: 'short',
    answerDeep: 'deep',
    answerSignal: 'signal',
    depth: 1,
    practice: true,
    sightings: [],
    followUps: []
});

const topics: InterviewTopic[] = [
    { topicId: 'methods', topicTitle: 'Methods', questions: [q('a', 'Is Java pass-by-value or pass-by-reference?')] },
    {
        topicId: 'collections',
        topicTitle: 'Collections',
        questions: [q('b', 'How does a HashMap store an entry?'), q('c', 'When would you use LinkedList?')]
    }
];

describe('InterviewBank', () => {
    it('explains how it works and lists the topics with their question counts', () => {
        render(<InterviewBank topics={topics} />);

        expect(screen.getByText('Answer out loud, then reveal')).toBeTruthy();
        const nav = screen.getByRole('navigation', { name: 'Interview topics' });
        expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(['Methods1', 'Collections2']);
    });

    it('opens on the first topic and switches when another is chosen', () => {
        render(<InterviewBank topics={topics} />);

        expect(screen.getByRole('heading', { name: 'Methods' })).toBeTruthy();
        expect(screen.getByText('Is Java pass-by-value or pass-by-reference?')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /Collections/ }));

        expect(screen.getByRole('heading', { name: 'Collections' })).toBeTruthy();
        expect(screen.getByText('2 questions')).toBeTruthy();
        expect(screen.getByText('Q2')).toBeTruthy();
        expect(screen.queryByText('Is Java pass-by-value or pass-by-reference?')).toBeNull();
        expect(screen.getByRole('button', { name: /Collections/ }).getAttribute('aria-current')).toBe('true');
    });
});
