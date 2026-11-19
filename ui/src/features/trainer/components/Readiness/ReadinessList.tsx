import React, { useEffect, useState } from 'react';
import { Gauge, Mic, Sparkles } from 'lucide-react';
import { fetchReadiness, type ReadinessLevel, type TopicReadiness } from '../../api/home.api';
import { weakTopicPrompt } from '../../utils/trainerText';
import styles from '../../styles/Trainer.module.css';

const LEVEL_LABELS: Record<ReadinessLevel, string> = {
    strong: 'Strong',
    okay: 'Okay',
    weak: 'Needs work',
    untested: 'Not tested yet'
};

const LEVEL_CLASSES: Record<ReadinessLevel, string | undefined> = {
    strong: styles.chipStrong,
    okay: styles.chipOkay,
    weak: styles.chipWeak,
    untested: undefined
};

export const LevelChip: React.FC<{ level: ReadinessLevel }> = ({ level }) => (
    <span className={`${styles.chip} ${LEVEL_CLASSES[level] ?? ''}`}>{LEVEL_LABELS[level] ?? level}</span>
);

interface ReadinessListProps {
    canAskAi: boolean;
    canPractise: boolean;
    onAskAi: (prompt: string) => void;
    onPractise: (topic: TopicReadiness) => void;
}

const details = (t: TopicReadiness) => {
    const parts: string[] = [];
    if (t.quizAccuracy != null) parts.push(`Quiz ${t.quizAccuracy}%`);
    else if (t.quizAnswered > 0) parts.push(`${t.quizAnswered} quiz answers`);
    if (t.interviewScore != null) parts.push(`Interview ${t.interviewScore}`);
    if (!t.completed) parts.push('in progress');
    return parts.join(' · ') || 'No quiz or interview yet';
};

/** How ready the learner is on each topic they have touched, weakest first. */
export const ReadinessList: React.FC<ReadinessListProps> = ({ canAskAi, canPractise, onAskAi, onPractise }) => {
    const [topics, setTopics] = useState<TopicReadiness[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        fetchReadiness()
            .then(t => active && setTopics(t))
            .catch(() => active && setError(true));
        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            <div className={styles.sectionHead}>
                <div>
                    <h2 className={styles.sectionTitle}>
                        <Gauge size={18} aria-hidden />
                        How ready you are
                    </h2>
                    <p className={styles.sectionLead}>From your quiz answers and topic interviews. Weakest first.</p>
                </div>
            </div>
            {error ? (
                <p className={styles.error} role="alert">Could not load your topics.</p>
            ) : topics === null ? (
                <span className={styles.busy}>
                    <span className={styles.spinner} /> Loading…
                </span>
            ) : topics.length === 0 ? (
                <p className={styles.muted}>Start a topic and answer its quiz to see how ready you are.</p>
            ) : (
                <ul className={styles.readinessList}>
                    {topics.map(t => {
                        const weak = t.level === 'weak';
                        return (
                            <li key={t.topicId} className={styles.readinessRow}>
                                <div className={styles.readinessName}>
                                    <span className={styles.readinessTitle}>{t.topicTitle}</span>
                                    <span className={styles.readinessMeta}>{details(t)}</span>
                                </div>
                                <div
                                    className={styles.bar}
                                    role="progressbar"
                                    aria-label={`${t.topicTitle} readiness`}
                                    aria-valuenow={t.readiness ?? 0}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <span className={styles.barFill} style={{ width: `${t.readiness ?? 0}%` }} />
                                </div>
                                <div className={styles.rowActions}>
                                    <LevelChip level={t.level} />
                                    {weak && canAskAi && (
                                        <button type="button" className={styles.secondaryBtn} onClick={() => onAskAi(weakTopicPrompt(t.topicTitle))}>
                                            <Sparkles size={14} aria-hidden />
                                            Ask AI
                                        </button>
                                    )}
                                    {weak && canPractise && t.interviewsTaken > 0 && (
                                        <button type="button" className={styles.secondaryBtn} onClick={() => onPractise(t)}>
                                            <Mic size={14} aria-hidden />
                                            Practise
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
};
