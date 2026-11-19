import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TopicInterviewReport } from './TopicInterviewReport';
import * as interviewApi from '../../api/interview.api';
import type { TopicInterviewReport as ReportData } from '../../api/interview.api';

// A report scored before M3: no kind, title, feedback or plan ids. It must still render.
const oldReport: ReportData = {
    id: 'interview-1',
    topicId: 'topic-1',
    topicTitle: 'Spring Dependency Injection',
    status: 'SCORED',
    overallScore: 88,
    pointsAwarded: 25,
    createdAt: '2026-10-24T12:00:00Z',
    completedAt: '2026-10-24T12:05:00Z',
    habits: {
        words_per_minute: 135,
        filler_words_count: 2,
        filler_words: { um: 2 },
        longest_pause_seconds: 3.2,
        average_words_per_answer: 45
    },
    questions: [
        {
            questionId: 'q-1',
            subtopicId: 'st-1',
            prompt: 'Explain Spring Bean scopes.',
            score: 9,
            good: 'Good distinction between singleton and prototype',
            missing: 'Mention thread safety considerations',
            evidence: 'Singleton is initialized once per container',
            modelAnswer: 'In Spring, beans are singleton by default, creating one shared instance.'
        }
    ],
    turns: []
};

const mockReport: ReportData = {
    id: 'mock-1',
    kind: 'HR',
    title: 'Data analyst',
    topicId: null,
    topicTitle: null,
    status: 'SCORED',
    overallScore: 64,
    pointsAwarded: 25,
    createdAt: '2026-11-12T10:00:00Z',
    completedAt: '2026-11-12T10:10:00Z',
    habits: null,
    feedback: {
        dimensions: { accuracy: 7, depth: 5, structure: 6, communication: 8 },
        strengths: ['Clear reasons for wanting the role'],
        improvements: ['Give one example with a result'],
        next_step: 'Prepare two short stories about your projects.'
    },
    learnerRating: null,
    parentInterviewId: null,
    questions: [
        {
            questionId: null,
            subtopicId: null,
            planQuestionId: 'pq-1',
            category: 'hr',
            topicId: null,
            prompt: 'Why do you want this job?',
            score: 6,
            good: 'Linked the job to your goal',
            missing: 'What you know about the company',
            evidence: 'I like working with data',
            modelAnswer: 'I want this role because…'
        },
        {
            questionId: 'bank-q',
            subtopicId: 'st-9',
            planQuestionId: 'pq-2',
            category: 'technical',
            topicId: 'topic-sql',
            prompt: 'What is a JOIN?',
            score: 7,
            good: null,
            missing: null,
            evidence: null,
            modelAnswer: null
        }
    ],
    turns: []
};

describe('TopicInterviewReport', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders overall score, speaking habits, and points awarded', () => {
        render(<TopicInterviewReport report={oldReport} onDone={vi.fn()} />);

        expect(screen.getByText('88')).toBeInTheDocument();
        expect(screen.getByText('+25 Points Earned')).toBeInTheDocument();
        expect(screen.getByText('135')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3.2s')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('renders an old report without feedback, kind or plan ids', () => {
        render(<TopicInterviewReport report={oldReport} onDone={vi.fn()} onRetryQuestion={vi.fn()} />);

        expect(screen.getByRole('heading', { name: 'Spring Dependency Injection' })).toBeInTheDocument();
        expect(screen.getByText('Topic interview')).toBeInTheDocument();
        expect(screen.queryByText('How your answers did')).not.toBeInTheDocument();
        // No plan id, so nothing to retry.
        expect(screen.queryByRole('button', { name: /Retry this question/i })).not.toBeInTheDocument();
    });

    it('renders question prompt, strengths, gaps, and toggles model answer', () => {
        render(<TopicInterviewReport report={oldReport} onDone={vi.fn()} />);

        expect(screen.getByText(/1\. Explain Spring Bean scopes\./i)).toBeInTheDocument();
        expect(screen.getByText(/9 \/ 10/i)).toBeInTheDocument();
        expect(screen.getByText(/Good distinction between singleton and prototype/i)).toBeInTheDocument();
        expect(screen.getByText(/Mention thread safety considerations/i)).toBeInTheDocument();
        expect(screen.getByText(/Singleton is initialized once per container/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /View model answer/i }));
        expect(screen.getByText(/In Spring, beans are singleton by default/i)).toBeInTheDocument();
    });

    it('calls onDone when clicking Done button', () => {
        const onDone = vi.fn();
        render(<TopicInterviewReport report={oldReport} onDone={onDone} />);
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));
        expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('shows the kind, title, four dimensions, strengths, improvements and next step', () => {
        render(<TopicInterviewReport report={mockReport} onDone={vi.fn()} />);

        expect(screen.getByText('HR round')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Data analyst' })).toBeInTheDocument();
        for (const label of ['Accuracy', 'Depth', 'Structure', 'Clarity']) {
            expect(screen.getByRole('progressbar', { name: label })).toBeInTheDocument();
        }
        expect(screen.getByRole('progressbar', { name: 'Clarity' })).toHaveAttribute('aria-valuenow', '8');
        expect(screen.getByText('Clear reasons for wanting the role')).toBeInTheDocument();
        expect(screen.getByText('Give one example with a result')).toBeInTheDocument();
        expect(screen.getByText('Prepare two short stories about your projects.')).toBeInTheDocument();
        expect(screen.getByText('HR')).toBeInTheDocument();
        expect(screen.getByText('Technical')).toBeInTheDocument();
    });

    it('offers a retry per question and a lesson only where the bank knows one', () => {
        const onRetry = vi.fn();
        const onRevise = vi.fn();
        render(<TopicInterviewReport report={mockReport} onDone={vi.fn()} onRetryQuestion={onRetry} onReviseLesson={onRevise} />);

        const retries = screen.getAllByRole('button', { name: /Retry this question/i });
        expect(retries).toHaveLength(2);
        fireEvent.click(retries[0]);
        expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ planQuestionId: 'pq-1' }));

        const lessons = screen.getAllByRole('button', { name: /Study this lesson/i });
        expect(lessons).toHaveLength(1);
        fireEvent.click(lessons[0]);
        expect(onRevise).toHaveBeenCalledWith('st-9', 'topic-sql');
    });

    it('shows the earlier score on a retry report', async () => {
        const fetchParent = vi.spyOn(interviewApi, 'fetchTopicInterview').mockResolvedValue({
            ...mockReport,
            questions: [{ ...mockReport.questions[0], score: 4 }]
        });
        const retry: ReportData = {
            ...mockReport,
            id: 'retry-1',
            kind: 'RETRY',
            pointsAwarded: 0,
            feedback: null,
            parentInterviewId: 'mock-1',
            questions: [{ ...mockReport.questions[0], score: 8 }]
        };
        render(<TopicInterviewReport report={retry} onDone={vi.fn()} />);

        expect(fetchParent).toHaveBeenCalledWith('mock-1');
        expect(await screen.findByText('Before: 4 / 10')).toBeInTheDocument();
        expect(screen.getByText('8 / 10')).toBeInTheDocument();
        expect(screen.getByText(/Practice round: no points/)).toBeInTheDocument();
    });

    it('saves a thumbs down and then an optional comment', async () => {
        const rate = vi.spyOn(interviewApi, 'rateInterview').mockResolvedValue();
        render(<TopicInterviewReport report={mockReport} onDone={vi.fn()} />);

        expect(screen.getByText('Was this evaluation fair?')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'No, it was not fair' }));
        await waitFor(() => expect(rate).toHaveBeenCalledWith('mock-1', -1));

        fireEvent.change(screen.getByPlaceholderText(/What did it get wrong/), { target: { value: 'It missed my second point' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));
        await waitFor(() => expect(rate).toHaveBeenLastCalledWith('mock-1', -1, 'It missed my second point'));
        expect(await screen.findByText('Thanks for the note.')).toBeInTheDocument();
    });
});
