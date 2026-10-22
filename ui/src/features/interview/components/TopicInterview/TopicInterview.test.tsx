import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TopicInterviewNav, TopicInterviewSection } from './TopicInterview';
import { groupByLesson } from '../../utils/topicInterview';
import type { InterviewQuestion } from '../../api/interview.api';

const q = (id: string, prompt: string, subtopicId: string, subtopicTitle: string): InterviewQuestion => ({
    id,
    prompt,
    subtopicId,
    subtopicTitle,
    answerShort: 'short',
    answerDeep: 'deep',
    answerSignal: 'signal',
    depth: 1,
    practice: true,
    sightings: [],
    followUps: []
});

const questions = [
    q('a', 'How does a HashMap find a key?', 'maps', 'Maps'),
    q('b', 'What happens on a collision?', 'maps', 'Maps'),
    q('c', 'Is String immutable?', 'strings', 'Strings')
];

/**
 * The study console's Interview pane and its list in the table of contents number the same
 * questions the same way, so "Q3" in the contents is the card labelled Q3.
 */
describe('TopicInterview', () => {
    it('groups questions under their lesson, keeping lesson order', () => {
        expect(groupByLesson(questions).map(g => [g.title, g.questions.length])).toEqual([
            ['Maps', 2],
            ['Strings', 1]
        ]);
    });

    it('numbers questions through the whole topic in the pane and in the contents alike', () => {
        const onSelect = vi.fn();
        render(
            <>
                <TopicInterviewSection topicTitle="Collections" questions={questions} />
                <TopicInterviewNav questions={questions} onSelect={onSelect} />
            </>
        );

        expect(screen.getAllByText('Q3')).toHaveLength(2);
        fireEvent.click(screen.getByRole('button', { name: /Q3 Is String immutable\?/ }));
        expect(onSelect).toHaveBeenCalledWith(questions[2]);
        expect(screen.getByText('3 questions')).toBeInTheDocument();
    });

    it('lets a learner go back to the lesson behind a question', () => {
        const onRevise = vi.fn();
        render(<TopicInterviewSection topicTitle="Collections" questions={questions} onRevise={onRevise} />);

        fireEvent.click(screen.getAllByRole('button', { name: /Revise the lesson: Maps/ })[0]);

        expect(onRevise).toHaveBeenCalledWith(questions[0]);
    });
});
