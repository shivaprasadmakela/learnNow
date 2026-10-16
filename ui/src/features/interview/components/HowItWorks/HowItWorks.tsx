import React from 'react';
import styles from '../../styles/Interview.module.css';

const STEPS = [
    { title: 'Read the question', detail: 'Each one is phrased the way an interviewer would ask it.' },
    { title: 'Answer out loud, then reveal', detail: 'Compare yours with a strong answer and see why it is asked.' },
    { title: 'Handle the follow-ups', detail: 'Interviewers dig deeper. Each answer unlocks the next question.' }
];

/** Three steps that say what the bank is for before any question is shown. */
export const HowItWorks: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
    <ol className={`${styles.howItWorks} ${compact ? styles.howItWorksCompact : ''}`.trim()}>
        {STEPS.map((step, i) => (
            <li key={step.title} className={styles.howStep}>
                <span className={styles.howNumber} aria-hidden="true">
                    {i + 1}
                </span>
                <span className={styles.howText}>
                    <strong>{step.title}</strong>
                    {!compact && <span>{step.detail}</span>}
                </span>
            </li>
        ))}
    </ol>
);
