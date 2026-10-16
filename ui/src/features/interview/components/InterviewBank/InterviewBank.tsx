import React, { useState } from 'react';
import type { InterviewQuestion, InterviewTopic } from '../../api/interview.api';
import { countQuestions } from '../../api/interview.api';
import { HowItWorks } from '../HowItWorks/HowItWorks';
import { InterviewQuestionCard } from '../InterviewQuestion/InterviewQuestion';
import styles from '../../styles/Interview.module.css';

export interface InterviewBankProps {
    topics: InterviewTopic[];
    loading?: boolean;
    /** Opens the lesson behind a question, for a learner who cannot answer it yet. */
    onRevise?: (question: InterviewQuestion) => void;
}

/**
 * A path's interview questions, browsed one topic at a time. Topics are what a learner thinks in
 * ("Methods", "Collections"); the list on the left is the bank, the panel on the right is one
 * section of it.
 */
export const InterviewBank: React.FC<InterviewBankProps> = ({ topics, loading, onRevise }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (loading) {
        return <p className={styles.bankStatus}>Loading interview questions…</p>;
    }
    if (topics.length === 0) {
        return <p className={styles.bankStatus}>No interview questions for this path yet.</p>;
    }

    const selected = topics.find(t => t.topicId === selectedId) ?? topics[0];
    const followUps = selected.questions.reduce((n, q) => n + countQuestions(q.followUps), 0);

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
                                        <span className={styles.topicCount}>{topic.questions.length}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <section className={styles.topicPanel} aria-labelledby="interview-topic-title">
                    <div className={styles.topicPanelHead}>
                        <h2 id="interview-topic-title" className={styles.topicPanelTitle}>
                            {selected.topicTitle}
                        </h2>
                        <p className={styles.topicPanelMeta}>
                            {selected.questions.length} question{selected.questions.length === 1 ? '' : 's'}
                            {followUps > 0 ? ` · ${followUps} follow-up${followUps === 1 ? '' : 's'}` : ''}
                        </p>
                    </div>
                    <div className={styles.cardList}>
                        {selected.questions.map((q, i) => (
                            <InterviewQuestionCard key={q.id} question={q} number={i + 1} onRevise={onRevise} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
