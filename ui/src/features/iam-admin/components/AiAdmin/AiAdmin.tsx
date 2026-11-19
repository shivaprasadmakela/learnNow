import React, { useCallback, useEffect, useState } from 'react';
import { Coins, Flag, Mic, Power, RefreshCw } from 'lucide-react';
import {
    AI_FEATURES,
    fetchAiAdmin,
    setAiFeatureEnabled,
    type AiAdminOverview,
    type AiFeature
} from '../../../trainer/api/aiAdmin.api';
import { interviewKindLabel, type InterviewKind, type InterviewStatus } from '../../../trainer/api/interview.api';
import styles from './AiAdmin.module.css';

const FEATURE_LABELS: Record<AiFeature, string> = {
    ASK_AI: 'Ask AI (chat and voice questions)',
    TOPIC_INTERVIEW: 'Topic interviews',
    MOCK_INTERVIEW: 'Mock interviews and retries',
    RESUME: 'Resume review',
    WEEKLY_PLAN: 'Weekly plan'
};

const STATUSES: InterviewStatus[] = ['SCORED', 'FAILED', 'ABANDONED', 'COMPLETED', 'CREATED'];

const rupees = (value: number | null | undefined) =>
    `₹${(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/**
 * The AI page in the admin studio: this month's spend against the cap, the feature switches,
 * interview counts and evaluations learners flagged as unfair. Transcripts are never shown here.
 */
export const AiAdmin: React.FC = () => {
    const [data, setData] = useState<AiAdminOverview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<AiFeature | null>(null);

    const load = useCallback(() => {
        fetchAiAdmin()
            .then(overview => {
                setData(overview);
                setError(null);
            })
            .catch(err => setError(err instanceof Error ? err.message : 'Could not load the AI overview.'));
    }, []);

    useEffect(load, [load]);

    const toggle = async (feature: AiFeature, enabled: boolean) => {
        if (!data) return;
        const before = data.flags;
        // Shown at once; put back if the server refuses.
        const others = before.filter(f => f.feature !== feature);
        setData({ ...data, flags: [...others, { feature, enabled, updatedAt: new Date().toISOString() }] });
        setSaving(feature);
        try {
            await setAiFeatureEnabled(feature, enabled);
        } catch (err) {
            setData(current => (current ? { ...current, flags: before } : current));
            setError(err instanceof Error ? err.message : 'Could not change the switch.');
        } finally {
            setSaving(null);
        }
    };

    if (!data) {
        return error ? (
            <div className={styles.wrap}>
                <p className={styles.error} role="alert">{error}</p>
                <button type="button" className={styles.button} onClick={load}>
                    <RefreshCw size={14} aria-hidden /> Try again
                </button>
            </div>
        ) : (
            <p className={styles.muted}>Loading the AI overview…</p>
        );
    }

    const usage = data.usage;
    const spentPct = usage && usage.cap_inr > 0 ? Math.min(100, Math.round((usage.spent_inr / usage.cap_inr) * 100)) : 0;
    const maxDaily = Math.max(1e-9, ...(usage?.daily ?? []).map(d => d.cost_inr));
    const isEnabled = (feature: AiFeature) => data.flags.find(f => f.feature === feature)?.enabled ?? true;
    const kinds = Object.keys(data.interviews?.thisMonth ?? {}) as InterviewKind[];

    return (
        <div className={styles.wrap}>
            {error && <p className={styles.error} role="alert">{error}</p>}

            <section className={styles.card}>
                <h2 className={styles.title}>
                    <Coins size={18} aria-hidden /> Spend this month
                </h2>
                {!usage ? (
                    <p className={styles.muted}>learnNow-ai could not be reached, so spend is not shown.</p>
                ) : (
                    <>
                        <div className={styles.spendHead}>
                            <span className={styles.big}>{rupees(usage.spent_inr)}</span>
                            <span className={styles.muted}>
                                of {rupees(usage.cap_inr)} cap · {usage.month}
                            </span>
                        </div>
                        <div className={styles.bar} role="progressbar" aria-label="Spend against cap" aria-valuenow={spentPct} aria-valuemin={0} aria-valuemax={100}>
                            <span className={spentPct >= 90 ? styles.barFillHot : styles.barFill} style={{ width: `${spentPct}%` }} />
                        </div>

                        {usage.daily.length > 0 && (
                            <div className={styles.chart} aria-label="Spend per day">
                                {usage.daily.map(d => (
                                    <div key={d.day} className={styles.chartCol} title={`${d.day}: ${rupees(d.cost_inr)}, ${d.calls} calls`}>
                                        <span className={styles.chartBar} style={{ height: `${Math.max(2, (d.cost_inr / maxDaily) * 100)}%` }} />
                                        <span className={styles.chartLabel}>{d.day.slice(-2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {usage.by_feature.length > 0 && (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Feature</th>
                                            <th>Provider</th>
                                            <th className={styles.num}>Calls</th>
                                            <th className={styles.num}>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usage.by_feature.map(f => (
                                            <tr key={`${f.feature}-${f.provider}`}>
                                                <td>{f.feature}</td>
                                                <td>{f.provider}</td>
                                                <td className={styles.num}>{f.calls}</td>
                                                <td className={styles.num}>{rupees(f.cost_inr)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>

            <section className={styles.card}>
                <h2 className={styles.title}>
                    <Power size={18} aria-hidden /> Feature switches
                </h2>
                <p className={styles.muted}>A switched-off feature is hidden from learners. Changes take up to a minute to apply.</p>
                <ul className={styles.flags}>
                    {AI_FEATURES.map(feature => (
                        <li key={feature}>
                            <label className={styles.flagRow}>
                                <span>{FEATURE_LABELS[feature]}</span>
                                <input
                                    type="checkbox"
                                    role="switch"
                                    checked={isEnabled(feature)}
                                    disabled={saving === feature}
                                    onChange={e => toggle(feature, e.target.checked)}
                                />
                            </label>
                        </li>
                    ))}
                </ul>
                <p className={styles.muted}>
                    Monthly limits per learner: {data.quotas.topicInterviews} topic interviews, {data.quotas.mockInterviews} mock
                    interviews, {data.quotas.resumeAnalyses} resume reviews.
                </p>
            </section>

            <section className={styles.card}>
                <h2 className={styles.title}>
                    <Mic size={18} aria-hidden /> Interviews this month
                </h2>
                {kinds.length === 0 ? (
                    <p className={styles.muted}>No interviews yet this month.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Kind</th>
                                    {STATUSES.map(s => (
                                        <th key={s} className={styles.num}>
                                            {s.charAt(0) + s.slice(1).toLowerCase()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {kinds.map(kind => (
                                    <tr key={kind}>
                                        <td>{interviewKindLabel(kind)}</td>
                                        {STATUSES.map(s => (
                                            <td key={s} className={styles.num}>
                                                {data.interviews.thisMonth[kind]?.[s] ?? 0}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className={styles.card}>
                <h2 className={styles.title}>
                    <Flag size={18} aria-hidden /> Evaluations flagged as unfair
                </h2>
                {data.flagged.length === 0 ? (
                    <p className={styles.muted}>No learner has flagged an evaluation.</p>
                ) : (
                    <ul className={styles.flagged}>
                        {data.flagged.map(f => (
                            <li key={f.id}>
                                <div className={styles.flaggedHead}>
                                    <strong>{f.title || interviewKindLabel(f.kind)}</strong>
                                    <span className={styles.muted}>
                                        {interviewKindLabel(f.kind)} · {f.overallScore ?? '–'} · {new Date(f.createdAt).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                                {f.comment ? <p>{f.comment}</p> : <p className={styles.muted}>No comment.</p>}
                                <code className={styles.id}>{f.id}</code>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default AiAdmin;
