import type { InterviewQuestion } from '../api/interview.api';

export interface LessonQuestions {
    subtopicId: string;
    title: string;
    questions: InterviewQuestion[];
}

/** Questions under the lesson that teaches them, keeping the order they arrive in - lesson order. */
export const groupByLesson = (questions: InterviewQuestion[]): LessonQuestions[] => {
    const groups: LessonQuestions[] = [];
    for (const q of questions) {
        const id = q.subtopicId ?? '';
        let group = groups.find(g => g.subtopicId === id);
        if (!group) {
            group = { subtopicId: id, title: q.subtopicTitle ?? 'Lesson', questions: [] };
            groups.push(group);
        }
        group.questions.push(q);
    }
    return groups;
};

/** Where a question's card is, for the table of contents to scroll to. */
export const interviewAnchorId = (questionId: string) => `interview-${questionId}`;
