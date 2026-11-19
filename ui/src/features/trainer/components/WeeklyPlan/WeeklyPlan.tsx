import React, { useEffect, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { fetchWeeklyPlan, generateWeeklyPlan, type PlanDay, type WeeklyPlan as Plan } from '../../api/plan.api';
import { shortDate, taskIcon } from '../../utils/trainerText';
import styles from '../../styles/Trainer.module.css';

const DAY_NAMES: Record<PlanDay, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday'
};

const TODAY: PlanDay = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as PlanDay[])[new Date().getDay()];

const hours = (minutes: number) => (minutes >= 60 ? `${Math.round((minutes / 60) * 10) / 10} h` : `${minutes} min`);

interface WeeklyPlanProps {
    personalised: boolean;
    /** Called after a new plan is written, so today's tasks elsewhere refresh. */
    onGenerated?: () => void;
}

/** This week's study plan, Monday to Sunday, written by the trainer from the learner's progress. */
export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ personalised, onGenerated }) => {
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        fetchWeeklyPlan()
            .then(p => active && setPlan(p))
            .catch(() => active && setError('Could not load your plan.'))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const generate = async () => {
        setGenerating(true);
        setError(null);
        try {
            setPlan(await generateWeeklyPlan());
            onGenerated?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not write your plan. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const content = plan?.plan;
    const refreshesLeft = plan?.refreshesLeft ?? 0;

    return (
        <>
            <div className={styles.sectionHead}>
                <div>
                    <h2 className={styles.sectionTitle}>
                        <CalendarDays size={18} aria-hidden />
                        This week's plan
                    </h2>
                    {content && (
                        <p className={styles.sectionLead}>
                            {hours(content.total_minutes)} in all, for the week of {shortDate(plan?.weekStart ?? '')}.
                        </p>
                    )}
                </div>
                {personalised && !loading && (
                    <div className={styles.actions}>
                        {generating ? (
                            <span className={styles.busy} role="status">
                                <span className={styles.spinner} /> Writing your plan…
                            </span>
                        ) : plan ? (
                            <button type="button" className={styles.secondaryBtn} onClick={generate} disabled={refreshesLeft <= 0}>
                                <RefreshCw size={14} aria-hidden />
                                Refresh ({refreshesLeft} left)
                            </button>
                        ) : (
                            <button type="button" className={styles.primaryBtn} onClick={generate}>
                                Generate my plan
                            </button>
                        )}
                    </div>
                )}
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}

            {loading ? (
                <span className={styles.busy}>
                    <span className={styles.spinner} /> Loading…
                </span>
            ) : !content ? (
                <p className={styles.muted}>
                    {personalised
                        ? 'Your trainer can plan your week: what to study each day and for how long, from your goal, your progress and the topics you find hard. You can refresh it up to 3 times a week.'
                        : 'A weekly plan is built from your progress, so it needs personalisation turned on.'}
                </p>
            ) : (
                <>
                    {content.headline && <p className={styles.planHeadline}>{content.headline}</p>}
                    {content.focus?.length > 0 && (
                        <div className={styles.focusRow} aria-label="Focus this week">
                            {content.focus.map(f => (
                                <span key={f} className={styles.chip}>
                                    {f}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className={styles.days}>
                        {content.days.map(d => {
                            const total = d.tasks.reduce((sum, t) => sum + (t.minutes || 0), 0);
                            return (
                                <div key={d.day} className={`${styles.day} ${d.day === TODAY ? styles.dayToday : ''}`}>
                                    <div className={styles.dayHead}>
                                        <span title={DAY_NAMES[d.day]}>{d.day === TODAY ? 'Today' : d.day}</span>
                                        <span className={styles.dayMinutes}>{total ? `${total} min` : 'Rest'}</span>
                                    </div>
                                    {d.tasks.length > 0 && (
                                        <ul className={styles.dayTasks}>
                                            {d.tasks.map((t, i) => {
                                                const Icon = taskIcon(t.kind);
                                                return (
                                                    <li key={`${t.title}-${i}`} className={styles.dayTask}>
                                                        <span>{t.title}</span>
                                                        <span className={styles.dayTaskMeta}>
                                                            <Icon size={11} aria-hidden /> {t.minutes} min{t.topic ? ` · ${t.topic}` : ''}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {content.advice?.length > 0 && (
                        <ul className={styles.adviceList}>
                            {content.advice.map(a => (
                                <li key={a}>{a}</li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </>
    );
};
