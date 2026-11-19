import React, { useState } from 'react';
import { saveGoal, type TrainerGoal } from '../../api/trainer.api';
import styles from './AboutYou.module.css';

interface GoalFormProps {
    goal: TrainerGoal | null;
    onSaved?: () => void;
    /** Hides the "Your goal" heading where the surrounding section already has one. */
    hideHeading?: boolean;
}

/** The learner's goal: target role, date and hours a week. Used by Ask AI and the trainer page. */
export const GoalForm: React.FC<GoalFormProps> = ({ goal: initial, onSaved, hideHeading = false }) => {
    const [goal, setGoal] = useState<TrainerGoal>(initial ?? {});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const change = (next: TrainerGoal) => {
        setGoal(next);
        setSaved(false);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await saveGoal({
                targetRole: goal.targetRole || null,
                targetDate: goal.targetDate || null,
                hoursPerWeek: goal.hoursPerWeek || null
            });
            setSaved(true);
            onSaved?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save your goal.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className={styles.goal} onSubmit={submit}>
            {!hideHeading && <h3>Your goal</h3>}
            <label>
                Target role
                <input value={goal.targetRole ?? ''} maxLength={120} placeholder="e.g. Java backend developer" onChange={e => change({ ...goal, targetRole: e.target.value })} />
            </label>
            <div className={styles.goalRow}>
                <label>
                    Target date
                    <input type="date" value={goal.targetDate ?? ''} onChange={e => change({ ...goal, targetDate: e.target.value })} />
                </label>
                <label>
                    Hours a week
                    <input type="number" min={1} max={80} value={goal.hoursPerWeek ?? ''} onChange={e => change({ ...goal, hoursPerWeek: e.target.value ? Number(e.target.value) : null })} />
                </label>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" className={styles.saveButton} disabled={saving}>
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save goal'}
            </button>
        </form>
    );
};
