import React, { Suspense, useEffect, useState } from 'react';
import { ArrowRight, Brain } from 'lucide-react';
import { fetchTrainerHome, type Nudge, type TrainerHome } from '../../api/home.api';
import { openAskAi } from '../../pageContext';
import { runNudgeAction } from '../../utils/nudgeAction';
import { NudgeList, TaskList } from '../TrainerToday';
import { LevelChip } from '../Readiness';
import styles from '../../styles/Trainer.module.css';

const TopicInterviewFlow = React.lazy(() =>
    import('../TopicInterview/TopicInterviewFlow').then(m => ({ default: m.TopicInterviewFlow }))
);

/** Sections of the trainer page a nudge can point at; the page scrolls to the one in the URL hash. */
export type TrainerSection = 'goal' | 'resume' | 'mock';

export interface TrainerCardProps {
    onOpenTrainer: (section?: TrainerSection) => void;
    onOpenTopic: (topicId: string, subtopicId?: string | null) => void;
}

/**
 * "Your trainer" on the dashboard: the most urgent nudge, today's tasks and the weakest topic.
 * Renders nothing when the AI service is not configured or the trainer could not be loaded; a
 * dashboard tile promising something that is not there is worse than none.
 */
export const TrainerCard: React.FC<TrainerCardProps> = ({ onOpenTrainer, onOpenTopic }) => {
    const [home, setHome] = useState<TrainerHome | null>(null);
    const [interview, setInterview] = useState<{ topicId: string; title: string } | null>(null);

    useEffect(() => {
        let active = true;
        fetchTrainerHome()
            .then(h => active && setHome(h))
            .catch(() => {
                /* The dashboard should not fail because one tile could not load. */
            });
        return () => {
            active = false;
        };
    }, []);

    if (!home?.available) return null;

    const topNudge = home.nudges[0];
    const weakest = home.readiness?.weakest?.[0];
    const tasks = home.todayTasks.slice(0, 3);

    const handleNudge = (nudge: Nudge) => {
        if (!nudge.action) return;
        runNudgeAction(
            nudge.action,
            {
                openLesson: onOpenTopic,
                startTopicInterview: (topicId, title) => setInterview({ topicId, title }),
                askAi: prompt => openAskAi(prompt),
                openTrainer: () => onOpenTrainer('goal'),
                uploadResume: () => onOpenTrainer('resume'),
                mockInterview: () => onOpenTrainer('mock')
            },
            nudge.title
        );
    };

    return (
        <section className={styles.card} aria-label="Your trainer">
            <div className={styles.cardHead}>
                <Brain size={16} aria-hidden />
                <h3 className={styles.cardTitle}>Your trainer</h3>
            </div>

            {!home.personalised ? (
                <p className={styles.muted}>Turn on personalisation and your trainer will suggest what to do each day.</p>
            ) : (
                <>
                    {topNudge && <NudgeList nudges={[topNudge]} features={home.features} onAction={handleNudge} />}
                    {tasks.length > 0 && (
                        <div>
                            <p className={styles.cardLabel}>Today</p>
                            <TaskList tasks={tasks} />
                        </div>
                    )}
                    {weakest && (
                        <div>
                            <p className={styles.cardLabel}>Weakest topic</p>
                            <div className={styles.task}>
                                <span className={styles.taskTitle}>{weakest.topicTitle}</span>
                                <LevelChip level={weakest.level} />
                            </div>
                        </div>
                    )}
                    {!topNudge && tasks.length === 0 && !weakest && (
                        <p className={styles.muted}>Nothing urgent today. Your trainer has a weekly plan and mock interviews ready when you are.</p>
                    )}
                </>
            )}

            <button type="button" className={styles.secondaryBtn} onClick={() => onOpenTrainer()}>
                Open trainer
                <ArrowRight size={14} aria-hidden />
            </button>

            {interview && (
                <Suspense fallback={null}>
                    <TopicInterviewFlow
                        isOpen
                        topicId={interview.topicId}
                        topicTitle={interview.title}
                        onClose={() => setInterview(null)}
                        onReviseLesson={(subtopicId, topicId) => {
                            setInterview(null);
                            onOpenTopic(topicId ?? interview.topicId, subtopicId);
                        }}
                    />
                </Suspense>
            )}
        </section>
    );
};
