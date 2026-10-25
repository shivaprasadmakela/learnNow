import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TopicInterviewOffer } from './TopicInterviewOffer';
import * as interviewApi from '../../api/interview.api';

describe('TopicInterviewOffer', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders null when topic has no interview questions', async () => {
        vi.spyOn(interviewApi, 'fetchInterviewAvailability').mockResolvedValue({
            available: false,
            reason: 'topic_interview_no_questions',
            left: 5
        });

        const { container } = render(
            <TopicInterviewOffer topicId="topic-1" topicTitle="Spring Core" />
        );

        await waitFor(() => {
            expect(container).toBeEmptyDOMElement();
        });
    });

    it('renders offer card with monthly quota and triggers onStartInterview', async () => {
        vi.spyOn(interviewApi, 'fetchInterviewAvailability').mockResolvedValue({
            available: true,
            reason: null,
            left: 4
        });

        const onStart = vi.fn();
        render(
            <TopicInterviewOffer
                topicId="topic-1"
                topicTitle="Spring Core"
                onStartInterview={onStart}
            />
        );

        expect(await screen.findByText('4 of 5 left this month')).toBeInTheDocument();
        expect(screen.getByText('Practice Topic Interview')).toBeInTheDocument();
        expect(screen.getByText('+15 pts (+10 bonus)')).toBeInTheDocument();

        const startBtn = screen.getByRole('button', { name: /Start Practice Interview/i });
        expect(startBtn).toBeEnabled();
        fireEvent.click(startBtn);

        expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('disables start button when quota is exhausted', async () => {
        vi.spyOn(interviewApi, 'fetchInterviewAvailability').mockResolvedValue({
            available: false,
            reason: 'topic_interview_quota_reached',
            left: 0
        });

        render(
            <TopicInterviewOffer topicId="topic-1" topicTitle="Spring Core" />
        );

        expect(await screen.findByText(/Monthly quota completed/i)).toBeInTheDocument();
        const startBtn = screen.getByRole('button', { name: /Start Practice Interview/i });
        expect(startBtn).toBeDisabled();
    });
});
