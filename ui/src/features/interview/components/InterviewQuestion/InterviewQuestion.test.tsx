import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InterviewQuestionCard } from './InterviewQuestion';
import type { InterviewQuestion, InterviewReveal } from '../../api/interview.api';
import * as api from '../../api/interview.api';

vi.mock('../../api/interview.api', () => ({
    fetchPathInterviewTopics: vi.fn(),
    fetchTopicInterviewQuestions: vi.fn(),
    fetchInterviewAnswer: vi.fn()
}));

// The answer hook ignores ids that are not UUIDs, as content ids always are.
const Q1 = '00000000-0000-4000-8000-000000000001';
const F1 = '00000000-0000-4000-8000-000000000002';
const F2 = '00000000-0000-4000-8000-000000000003';

const prompt = (id: string, text: string, depth: number, followUpCount: number): InterviewQuestion => ({
    id,
    prompt: text,
    depth,
    practice: true,
    sightings: [],
    followUpCount
});

const third = prompt(F2, 'Why not use a tree for every bucket?', 3, 0);
const second = prompt(F1, 'What happens on a collision?', 2, 1);

const question = (over: Partial<InterviewQuestion> = {}): InterviewQuestion => ({
    ...prompt(Q1, 'How does a HashMap store and find an entry?', 1, 2),
    topicId: 't1',
    subtopicId: 's1',
    subtopicTitle: 'Maps, and the methods that replace bookkeeping',
    ...over
});

const oldAnswer = (questionId: string, short: string, followUps: InterviewQuestion[]): InterviewReveal => ({
    questionId,
    answer: null,
    answerShort: short,
    answerDeep: 'First paragraph of the deep answer.\n\nSecond paragraph.',
    answerSignal: 'Whether you understand hashing plus equality.',
    followUps
});

let reveals: Record<string, InterviewReveal>;

beforeEach(() => {
    reveals = {
        [Q1]: oldAnswer(Q1, 'It hashes the key and picks a bucket.', [second]),
        [F1]: oldAnswer(F1, 'The chain grows.', [third]),
        [F2]: oldAnswer(F2, 'Most buckets hold one or two entries.', [])
    };
    vi.mocked(api.fetchInterviewAnswer)
        .mockReset()
        .mockImplementation(id => Promise.resolve(reveals[id]));
});

describe('InterviewQuestionCard', () => {
    it('reads as an interview: the interviewer asks, and the answer is fetched only when revealed', async () => {
        render(<InterviewQuestionCard question={question()} number={1} />);

        expect(screen.getByText('Q1')).toBeTruthy();
        expect(screen.getByText('Interviewer asks')).toBeTruthy();
        expect(api.fetchInterviewAnswer).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));

        expect(await screen.findByText('It hashes the key and picks a bucket.')).toBeTruthy();
        expect(screen.getByText('A strong answer')).toBeTruthy();
        expect(screen.getByText('Why they ask this')).toBeTruthy();
        expect(api.fetchInterviewAnswer).toHaveBeenCalledWith(Q1);
    });

    it('says up front how many follow-ups there are, and unlocks them one answer at a time', async () => {
        render(<InterviewQuestionCard question={question()} />);

        // Two follow-ups behind this question, visible as a count before anything is revealed.
        expect(screen.getByText('2 follow-ups')).toBeTruthy();
        expect(screen.queryByText('What happens on a collision?')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));
        expect(await screen.findByText('What happens on a collision?')).toBeTruthy();
        expect(screen.getByText('The interviewer digs deeper')).toBeTruthy();
        expect(screen.getByText('Interviewer follows up')).toBeTruthy();
        // The third level stays hidden, and unfetched, until the second is answered.
        expect(screen.queryByText('Why not use a tree for every bucket?')).toBeNull();
        expect(api.fetchInterviewAnswer).not.toHaveBeenCalledWith(F1);

        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));
        expect(await screen.findByText('Why not use a tree for every bucket?')).toBeTruthy();
    });

    it('keeps the deeper answer folded until asked for, as separate paragraphs', async () => {
        reveals[Q1] = oldAnswer(Q1, 'It hashes the key and picks a bucket.', []);
        render(<InterviewQuestionCard question={question({ followUpCount: 0 })} />);
        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));

        fireEvent.click(await screen.findByRole('button', { name: 'Go deeper' }));
        expect(screen.getByText('First paragraph of the deep answer.').tagName).toBe('P');
        expect(screen.getByText('Second paragraph.').tagName).toBe('P');
    });

    it('says so when the answer cannot be loaded', async () => {
        vi.mocked(api.fetchInterviewAnswer).mockRejectedValueOnce(new Error('offline'));
        render(<InterviewQuestionCard question={question()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));

        expect(await screen.findByText(/The answer could not be loaded/)).toBeTruthy();
    });

    it('shows no provenance label at all for a question nobody has reported', () => {
        render(<InterviewQuestionCard question={question()} />);
        expect(screen.queryByText('Practice')).toBeNull();
        expect(screen.queryByText(/Asked at/)).toBeNull();
    });

    it('shows where a reported question was asked, without the month slipping west of UTC', () => {
        render(
            <InterviewQuestionCard
                question={question({
                    practice: false,
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
        const q = question();
        render(<InterviewQuestionCard question={q} onRevise={onRevise} />);

        fireEvent.click(screen.getByRole('button', { name: /Revise the lesson: Maps, and the methods/ }));
        expect(onRevise).toHaveBeenCalledWith(q);
    });

    it('shows a beginner answer as numbered steps, then the words to say', async () => {
        reveals[Q1] = {
            questionId: Q1,
            answer: {
                simple: 'Spring **profiles** pick a set of settings per environment.',
                how: 'Put each environment in its own file:\n\n```properties\nserver.port=8080\n```',
                usage: null,
                example: '- Development uses your local database.',
                script: 'I use Spring Profiles, one file per environment.',
                remember: 'Same code, different configuration.',
                caution: 'Keep passwords out of these files.'
            },
            followUps: []
        };
        render(<InterviewQuestionCard question={question({ followUpCount: 0 })} />);

        fireEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));

        expect(await screen.findByText('Same code, different configuration.')).toBeInTheDocument();
        // "How to use it" is left out when the question has no usage section.
        expect(screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent)).toEqual([
            '1In simple words',
            '2How it works',
            '3A real-world example',
            'Say it like this'
        ]);
        expect(screen.getByText('profiles').tagName).toBe('STRONG');
        expect(screen.getByText('server.port=8080')).toBeInTheDocument();
        expect(screen.getByText('Keep passwords out of these files.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Go deeper/ })).not.toBeInTheDocument();
    });
});
