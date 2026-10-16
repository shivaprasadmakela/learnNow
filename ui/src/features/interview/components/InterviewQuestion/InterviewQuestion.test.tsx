import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InterviewQuestionCard } from './InterviewQuestion';
import type { InterviewQuestion } from '../../api/interview.api';

const third: InterviewQuestion = {
    id: 'f2',
    prompt: 'Why not use a tree for every bucket?',
    answerShort: 'Most buckets hold one or two entries.',
    answerDeep: 'Tree nodes cost more.',
    answerSignal: 'Reasoning about trade-offs.',
    depth: 3,
    practice: true,
    sightings: [],
    followUps: []
};

const second: InterviewQuestion = { ...third, id: 'f1', prompt: 'What happens on a collision?', answerShort: 'The chain grows.', depth: 2, followUps: [third] };

const question = (over: Partial<InterviewQuestion> = {}): InterviewQuestion => ({
    id: 'q1',
    topicId: 't1',
    subtopicId: 's1',
    subtopicTitle: 'Maps, and the methods that replace bookkeeping',
    prompt: 'How does a HashMap store and find an entry?',
    answerShort: 'It hashes the key and picks a bucket.',
    answerDeep: 'First paragraph of the deep answer.\n\nSecond paragraph.',
    answerSignal: 'Whether you understand hashing plus equality.',
    depth: 1,
    practice: true,
    sightings: [],
    followUps: [second],
    ...over
});

describe('InterviewQuestionCard', () => {
    it('reads as an interview: the interviewer asks, and the answer waits until revealed', () => {
        render(<InterviewQuestionCard question={question()} number={1} />);

        expect(screen.getByText('Q1')).toBeTruthy();
        expect(screen.getByText('Interviewer asks')).toBeTruthy();
        expect(screen.queryByText('It hashes the key and picks a bucket.')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));

        expect(screen.getByText('A strong answer')).toBeTruthy();
        expect(screen.getByText('It hashes the key and picks a bucket.')).toBeTruthy();
        expect(screen.getByText('Why they ask this')).toBeTruthy();
    });

    it('says up front how many follow-ups there are, and unlocks them one answer at a time', () => {
        render(<InterviewQuestionCard question={question()} />);

        // Two follow-ups behind this question, visible as a count before anything is revealed.
        expect(screen.getByText('2 follow-ups')).toBeTruthy();
        expect(screen.queryByText('What happens on a collision?')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));
        expect(screen.getByText('The interviewer digs deeper')).toBeTruthy();
        expect(screen.getByText('What happens on a collision?')).toBeTruthy();
        expect(screen.getByText('Interviewer follows up')).toBeTruthy();
        // The third level stays hidden until the second is answered.
        expect(screen.queryByText('Why not use a tree for every bucket?')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));
        expect(screen.getByText('Why not use a tree for every bucket?')).toBeTruthy();
    });

    it('keeps the deeper answer folded until asked for, as separate paragraphs', () => {
        render(<InterviewQuestionCard question={question({ followUps: [] })} />);
        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));

        expect(screen.queryByText('Second paragraph.')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Go deeper' }));
        expect(screen.getByText('First paragraph of the deep answer.').tagName).toBe('P');
        expect(screen.getByText('Second paragraph.').tagName).toBe('P');
    });

    it('shows no provenance label at all for a question nobody has reported', () => {
        render(<InterviewQuestionCard question={question({ followUps: [] })} />);
        expect(screen.queryByText('Practice')).toBeNull();
        expect(screen.queryByText(/Asked at/)).toBeNull();
    });

    it('shows where a reported question was asked, without the month slipping west of UTC', () => {
        render(
            <InterviewQuestionCard
                question={question({
                    practice: false,
                    followUps: [],
                    sightings: [
                        { company: 'Acme Payments', role: 'Backend Engineer', seenMonth: '2026-09-01' },
                        { company: 'Globex', seenMonth: '2026-06-01' }
                    ]
                })}
            />
        );
        expect(screen.getByText('Asked at Acme Payments · Sep 2026 +1 more')).toBeTruthy();
    });

    it('offers the lesson behind the question for a learner who cannot answer it', () => {
        const onRevise = vi.fn();
        const q = question({ followUps: [] });
        render(<InterviewQuestionCard question={q} onRevise={onRevise} />);

        fireEvent.click(screen.getByRole('button', { name: /Revise the lesson: Maps, and the methods/ }));
        expect(onRevise).toHaveBeenCalledWith(q);
    });
});
