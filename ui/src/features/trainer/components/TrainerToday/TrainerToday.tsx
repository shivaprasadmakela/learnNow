import React from 'react';
import type { Nudge, PlanTask, TrainerFeatures } from '../../api/home.api';
import { canRunNudgeAction } from '../../utils/nudgeAction';
import { taskIcon } from '../../utils/trainerText';
import styles from '../../styles/Trainer.module.css';

interface NudgeListProps {
    nudges: Nudge[];
    features: TrainerFeatures | null;
    onAction: (nudge: Nudge) => void;
}

/** The trainer's suggestions, most urgent first, each with the button that acts on it. */
export const NudgeList: React.FC<NudgeListProps> = ({ nudges, features, onAction }) => (
    <ul className={styles.nudgeList}>
        {nudges.map(n => (
            <li key={`${n.kind}-${n.title}`} className={styles.nudge}>
                <div className={styles.nudgeText}>
                    <span className={styles.nudgeTitle}>{n.title}</span>
                    {n.body && <span className={styles.nudgeBody}>{n.body}</span>}
                </div>
                {n.action && canRunNudgeAction(n.action, features) && (
                    <button type="button" className={styles.primaryBtn} onClick={() => onAction(n)}>
                        {n.action.label}
                    </button>
                )}
            </li>
        ))}
    </ul>
);

/** Today's tasks from this week's plan. */
export const TaskList: React.FC<{ tasks: PlanTask[] }> = ({ tasks }) => (
    <ul className={styles.taskList}>
        {tasks.map((t, i) => {
            const Icon = taskIcon(t.kind);
            return (
                <li key={`${t.title}-${i}`} className={styles.task}>
                    <Icon size={16} aria-hidden />
                    <span className={styles.taskTitle}>
                        {t.title}
                        {t.topic && <span className={styles.taskTopic}>{t.topic}</span>}
                    </span>
                    <span className={styles.taskMinutes}>{t.minutes} min</span>
                </li>
            );
        })}
    </ul>
);
