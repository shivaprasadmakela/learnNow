import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TopicInterviewReport } from './TopicInterviewReport';
import type { TopicInterviewReport as ReportData } from '../../api/interview.api';

const mockReport: ReportData = {
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

describe('TopicInterviewReport', () => {
    it('renders overall score, speaking habits, and points awarded', () => {
        const onDone = vi.fn();
        render(<TopicInterviewReport report={mockReport} onDone={onDone} />);

        expect(screen.getByText('88')).toBeInTheDocument();
        expect(screen.getByText('+25 Points Earned')).toBeInTheDocument();
        expect(screen.getByText('135')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3.2s')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('renders question prompt, strengths, gaps, and toggles model answer', () => {
        const onDone = vi.fn();
        render(<TopicInterviewReport report={mockReport} onDone={onDone} />);

        expect(screen.getByText(/1\. Explain Spring Bean scopes\./i)).toBeInTheDocument();
        expect(screen.getByText(/9 \/ 10/i)).toBeInTheDocument();
        expect(screen.getByText(/Good distinction between singleton and prototype/i)).toBeInTheDocument();
        expect(screen.getByText(/Mention thread safety considerations/i)).toBeInTheDocument();

        // Model answer toggle
        const toggleBtn = screen.getByRole('button', { name: /View model answer/i });
        expect(toggleBtn).toBeInTheDocument();
        fireEvent.click(toggleBtn);

        expect(screen.getByText(/In Spring, beans are singleton by default/i)).toBeInTheDocument();
    });

    it('calls onDone when clicking Done button', () => {
        const onDone = vi.fn();
        render(<TopicInterviewReport report={mockReport} onDone={onDone} />);

        const doneBtn = screen.getByRole('button', { name: 'Done' });
        fireEvent.click(doneBtn);

        expect(onDone).toHaveBeenCalledTimes(1);
    });
});
