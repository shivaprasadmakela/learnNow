import React, { useEffect, useState } from 'react';
import { ChevronRight, History } from 'lucide-react';
import {
    fetchTopicInterviews,
    interviewKindLabel,
    interviewTitle,
    type InterviewStatus,
    type TopicInterviewSummary
} from '../../api/interview.api';
import { shortDate } from '../../utils/trainerText';
import styles from '../../styles/Trainer.module.css';

const STATUS_TEXT: Partial<Record<InterviewStatus, string>> = {
    CREATED: 'In progress',
    COMPLETED: 'Being scored',
    FAILED: 'Not scored',
    ABANDONED: 'Ended early'
};

interface InterviewHistoryProps {
    /** Changes when an interview finishes, so the list loads again. */
    refreshKey?: unknown;
    onOpen: (interview: TopicInterviewSummary) => void;
}

/** Every interview the learner has taken, newest first, each opening its report. */
export const InterviewHistory: React.FC<InterviewHistoryProps> = ({ refreshKey, onOpen }) => {
    const [items, setItems] = useState<TopicInterviewSummary[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        fetchTopicInterviews()
            .then(list => active && setItems(list))
            .catch(() => active && setError(true));
        return () => {
            active = false;
        };
    }, [refreshKey]);

    return (
        <>
            <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>
                    <History size={18} aria-hidden />
                    Your interviews
                </h2>
            </div>
            {error ? (
                <p className={styles.error} role="alert">Could not load your interviews.</p>
            ) : items === null ? (
                <span className={styles.busy}>
                    <span className={styles.spinner} /> Loading…
                </span>
            ) : items.length === 0 ? (
                <p className={styles.muted}>No interviews yet. Finish a topic or start a mock interview to take your first one.</p>
            ) : (
                <ul className={styles.historyList}>
                    {items.map(i => (
                        <li key={i.id}>
                            <button type="button" className={styles.historyRow} onClick={() => onOpen(i)}>
                                <span className={styles.historyMain}>
                                    <span className={styles.historyTitle}>{interviewTitle(i)}</span>
                                    <span className={styles.historyMeta}>
                                        {interviewKindLabel(i.kind)} · {shortDate(i.createdAt)}
                                        {STATUS_TEXT[i.status] ? ` · ${STATUS_TEXT[i.status]}` : ''}
                                    </span>
                                </span>
                                {i.status === 'SCORED' && i.overallScore != null && (
                                    <span className={styles.historyScore}>{i.overallScore}</span>
                                )}
                                <ChevronRight size={16} aria-hidden />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
};
