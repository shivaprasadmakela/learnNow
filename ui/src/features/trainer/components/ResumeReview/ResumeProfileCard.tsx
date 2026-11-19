import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { updateResumeProfile, type Resume, type ResumeLevel } from '../../api/resume.api';
import shared from '../../styles/Trainer.module.css';
import styles from './ResumeReview.module.css';

const LEVELS: { value: ResumeLevel; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'fresher', label: 'Fresher' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid-level' },
    { value: 'senior', label: 'Senior' }
];

const levelLabel = (level: ResumeLevel) => LEVELS.find(l => l.value === level)?.label ?? level;

/** What was read from the resume, with a form to correct it. Interviews are built from this. */
export const ResumeProfileCard: React.FC<{ resume: Resume; onChange: (resume: Resume) => void }> = ({ resume, onChange }) => {
    const profile = resume.profile;
    const [editing, setEditing] = useState(false);
    const [headline, setHeadline] = useState(profile.headline ?? '');
    const [level, setLevel] = useState<ResumeLevel>(profile.level ?? 'fresher');
    const [years, setYears] = useState(profile.years_experience != null ? String(profile.years_experience) : '');
    const [targetRole, setTargetRole] = useState(resume.targetRole ?? profile.target_roles?.[0] ?? '');
    const [skills, setSkills] = useState((profile.skills ?? []).join(', '));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const updated = await updateResumeProfile({
                headline: headline.trim(),
                level,
                yearsExperience: years.trim() === '' ? null : Number(years),
                targetRole: targetRole.trim() || null,
                skills: skills
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
            });
            onChange(updated);
            setEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save your changes.');
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <form className={styles.profileForm} onSubmit={save}>
                <label className={shared.field}>
                    Headline
                    <input value={headline} maxLength={200} onChange={e => setHeadline(e.target.value)} />
                </label>
                <div className={styles.formRow}>
                    <label className={shared.field}>
                        Level
                        <select value={level} onChange={e => setLevel(e.target.value as ResumeLevel)}>
                            {LEVELS.map(l => (
                                <option key={l.value} value={l.value}>
                                    {l.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={shared.field}>
                        Years of experience
                        <input type="number" min={0} max={60} step={0.5} value={years} onChange={e => setYears(e.target.value)} />
                    </label>
                </div>
                <label className={shared.field}>
                    Target role
                    <input value={targetRole} maxLength={120} onChange={e => setTargetRole(e.target.value)} />
                </label>
                <label className={shared.field}>
                    Skills, separated by commas
                    <textarea rows={3} value={skills} onChange={e => setSkills(e.target.value)} />
                </label>
                {error && <p className={shared.error} role="alert">{error}</p>}
                <div className={shared.actions}>
                    <button type="submit" className={shared.primaryBtn} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className={shared.secondaryBtn} onClick={() => setEditing(false)} disabled={saving}>
                        Cancel
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div className={styles.profile}>
            <div className={shared.sectionHead}>
                <div>
                    <h3 className={styles.subTitle}>What we read from it</h3>
                    {profile.headline && <p className={styles.headline}>{profile.headline}</p>}
                </div>
                <button type="button" className={shared.secondaryBtn} onClick={() => setEditing(true)}>
                    <Pencil size={14} aria-hidden />
                    Edit
                </button>
            </div>
            <dl className={styles.facts}>
                <div>
                    <dt>Level</dt>
                    <dd>{levelLabel(profile.level)}</dd>
                </div>
                <div>
                    <dt>Experience</dt>
                    <dd>{profile.years_experience != null ? `${profile.years_experience} years` : 'Not stated'}</dd>
                </div>
                <div>
                    <dt>Target role</dt>
                    <dd>{resume.targetRole || profile.target_roles?.[0] || 'Not set'}</dd>
                </div>
            </dl>
            {profile.skills?.length > 0 && (
                <div className={shared.focusRow} aria-label="Skills">
                    {profile.skills.map(s => (
                        <span key={s} className={shared.chip}>
                            {s}
                        </span>
                    ))}
                </div>
            )}
            {profile.experience?.length > 0 && (
                <ul className={styles.list}>
                    {profile.experience.map(x => (
                        <li key={`${x.title}-${x.company}-${x.period}`}>
                            <strong>{x.title}</strong>
                            {x.company && `, ${x.company}`}
                            {x.period && <span className={styles.period}> · {x.period}</span>}
                        </li>
                    ))}
                </ul>
            )}
            {profile.projects?.length > 0 && (
                <p className={shared.muted}>Projects: {profile.projects.map(p => p.name).join(', ')}</p>
            )}
        </div>
    );
};
