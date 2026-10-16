import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { useSubtopicInterviewQuestions } from '../../hooks/useInterviewQuestions';
import { InterviewQuestionCard } from '../InterviewQuestion/InterviewQuestion';
import styles from '../../styles/Interview.module.css';

/**
 * How the lesson just read comes up in an interview, placed after its concept check. Renders
 * nothing when the subtopic has no questions - most do not yet, and an empty box under every
 * lesson would be noise.
 */
export const SubtopicInterviewQuestions: React.FC<{ subtopicId: string | number }> = ({
    subtopicId
}) => {
    const questions = useSubtopicInterviewQuestions(subtopicId);
    if (questions.length === 0) return null;

    return (
        <section className={styles.lessonBlock} aria-label="Interview questions on this lesson">
            <div className={styles.lessonBlockHead}>
                <MessagesSquare size={16} aria-hidden="true" />
                <span>How this comes up in interviews</span>
            </div>
            <p className={styles.lessonBlockIntro}>
                Answer out loud first, then reveal. Each answer can lead to a harder follow-up.
            </p>
            <div className={styles.cardList}>
                {questions.map((q, i) => (
                    <InterviewQuestionCard
                        key={q.id}
                        question={q}
                        number={questions.length > 1 ? i + 1 : undefined}
                    />
                ))}
            </div>
        </section>
    );
};
