import React from 'react';
import type { InterviewQuestion } from '../../api/interview.api';
import { groupByLesson, interviewAnchorId, type LessonQuestions } from '../../utils/topicInterview';
import { HowItWorks } from '../HowItWorks/HowItWorks';
import { InterviewQuestionCard } from '../InterviewQuestion/InterviewQuestion';
import styles from '../../styles/Interview.module.css';

/** Numbers run through the whole topic, so Q4 in the contents is Q4 in the pane. */
const numbered = (groups: LessonQuestions[]) => {
    let n = 0;
    return groups.map(g => ({ ...g, numbers: g.questions.map(() => ++n) }));
};

export interface TopicInterviewSectionProps {
    topicTitle: string;
    questions: InterviewQuestion[];
    /** Opens the lesson behind a question, for a learner who cannot answer it yet. */
    onRevise?: (question: InterviewQuestion) => void;
}

/** The study console's Interview tab: one topic's questions, grouped by lesson. */
export const TopicInterviewSection: React.FC<TopicInterviewSectionProps> = ({
    topicTitle,
    questions,
    onRevise
}) => {
    const groups = numbered(groupByLesson(questions));
    const followUps = questions.reduce((n, q) => n + q.followUpCount, 0);

    return (
        <section className={styles.section} aria-labelledby="topic-interview-title">
            <div className={styles.sectionHead}>
                <div>
                    <h1 id="topic-interview-title" className={styles.sectionTitle}>
                        Interview questions: {topicTitle}
                    </h1>
                    <p className={styles.sectionMeta}>
                        {questions.length} question{questions.length === 1 ? '' : 's'}
                        {followUps > 0 ? ` · ${followUps} follow-up${followUps === 1 ? '' : 's'}` : ''}
                    </p>
                </div>
                <HowItWorks compact />
            </div>

            {groups.map(group => (
                <div key={group.subtopicId} className={styles.lessonGroup}>
                    <h2 className={styles.lessonGroupTitle}>{group.title}</h2>
                    <div className={styles.cardList}>
                        {group.questions.map((q, i) => (
                            <div key={q.id} id={interviewAnchorId(q.id)} className={styles.anchor}>
                                <InterviewQuestionCard question={q} number={group.numbers[i]} onRevise={onRevise} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
};

export interface TopicInterviewNavProps {
    questions: InterviewQuestion[];
    onSelect: (question: InterviewQuestion) => void;
}

/** The Interview list in the study console's table of contents: Q1, Q2... in lesson order. */
export const TopicInterviewNav: React.FC<TopicInterviewNavProps> = ({ questions, onSelect }) => (
    <ul className={styles.tocGroup}>
        {questions.map((q, i) => (
            <li key={q.id}>
                <button type="button" className={styles.tocQuestion} onClick={() => onSelect(q)}>
                    <span className={styles.tocNumber}>Q{i + 1}</span>{' '}
                    <span>{q.prompt}</span>
                </button>
            </li>
        ))}
    </ul>
);
