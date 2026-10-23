import React, { useState } from 'react';
import type { InterviewQuestion } from '../../api/interview.api';
import { usePathInterviewTopics, useTopicInterviewQuestions } from '../../hooks/useInterviewQuestions';
import { HowItWorks } from '../HowItWorks/HowItWorks';
import { InterviewQuestionCard } from '../InterviewQuestion/InterviewQuestion';
import styles from '../../styles/Interview.module.css';

export interface InterviewBankProps {
    /** The path whose bank this is. Its topics load when the bank is shown. */
    pathId: string | number;
    /** Opens the lesson behind a question, for a learner who cannot answer it yet. */
    onRevise?: (question: InterviewQuestion) => void;
}

/**
 * A path's interview questions, browsed one topic at a time. Topics are what a learner thinks in
 * ("Methods", "Collections"); the list on the left is the bank, the panel on the right is one
 * section of it. Only what is on screen is fetched: the list of topics with their counts, then the
 * questions of the topic that is open.
 */
export const InterviewBank: React.FC<InterviewBankProps> = ({ pathId, onRevise }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const topicList = usePathInterviewTopics(pathId);
    const topics = topicList.data ?? [];
    const selected = topics.find(t => t.topicId === selectedId) ?? topics[0];
    const questions = useTopicInterviewQuestions(selected?.topicId);

    if (topicList.loading) {
        return <p className={styles.bankStatus}>Loading interview questions…</p>;
    }
    if (topicList.failed) {
        return <p className={styles.bankStatus}>The interview questions could not be loaded.</p>;
    }
    if (!selected) {
        return <p className={styles.bankStatus}>No interview questions for this path yet.</p>;
    }

    return (
        <div className={styles.bank}>
            <HowItWorks />

            <div className={styles.bankLayout}>
                <nav className={styles.topicNav} aria-label="Interview topics">
                    <span className={styles.topicNavTitle}>Topics</span>
                    <ul className={styles.topicList}>
                        {topics.map(topic => {
                            const active = topic.topicId === selected.topicId;
                            return (
                                <li key={topic.topicId}>
                                    <button
                                        type="button"
                                        className={`${styles.topicBtn} ${active ? styles.topicBtnActive : ''}`.trim()}
                                        aria-current={active ? 'true' : undefined}
                                        onClick={() => setSelectedId(topic.topicId)}
                                    >
                                        <span className={styles.topicName}>{topic.topicTitle}</span>
                                        <span className={styles.topicCount}>{topic.questionCount}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <section className={styles.topicPanel} aria-labelledby="interview-topic-title" aria-busy={questions.loading}>
                    <div className={styles.topicPanelHead}>
                        <h2 id="interview-topic-title" className={styles.topicPanelTitle}>
                            {selected.topicTitle}
                        </h2>
                        <p className={styles.topicPanelMeta}>
                            {selected.questionCount} question{selected.questionCount === 1 ? '' : 's'}
                            {selected.followUpCount > 0
                                ? ` · ${selected.followUpCount} follow-up${selected.followUpCount === 1 ? '' : 's'}`
                                : ''}
                        </p>
                    </div>
                    {questions.loading ? (
                        <p className={styles.bankStatus}>Loading questions…</p>
                    ) : questions.failed ? (
                        <p className={styles.bankStatus}>These questions could not be loaded.</p>
                    ) : (
                        <div className={styles.cardList}>
                            {(questions.data ?? []).map((q, i) => (
                                <InterviewQuestionCard key={q.id} question={q} number={i + 1} onRevise={onRevise} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
