import React, { useState } from 'react';
import { matchJobDescription, type Resume } from '../../api/resume.api';
import shared from '../../styles/Trainer.module.css';
import styles from './ResumeReview.module.css';

const MIN_CHARS = 80;
const MAX_CHARS = 8000;

/** Paste a job description to see how well the resume fits it and what to add. */
export const JobMatchBox: React.FC<{ resume: Resume; onChange: (resume: Resume) => void }> = ({ resume, onChange }) => {
    const [text, setText] = useState(resume.jobDescription ?? '');
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const match = resume.jobMatch;
    const length = text.trim().length;

    const check = async (e: React.FormEvent) => {
        e.preventDefault();
        setChecking(true);
        setError(null);
        try {
            onChange(await matchJobDescription(text.trim()));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not compare your resume with this job.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className={styles.match}>
            <h3 className={styles.subTitle}>Compare with a job</h3>
            <form onSubmit={check} className={styles.profileForm}>
                <label className={shared.field}>
                    Paste the job description
                    <textarea rows={5} value={text} maxLength={MAX_CHARS} onChange={e => setText(e.target.value)} />
                </label>
                {length > 0 && length < MIN_CHARS && <p className={shared.muted}>Paste a little more of the job description to compare.</p>}
                {error && <p className={shared.error} role="alert">{error}</p>}
                <div className={shared.actions}>
                    {checking ? (
                        <span className={shared.busy} role="status">
                            <span className={shared.spinner} /> Comparing…
                        </span>
                    ) : (
                        <button type="submit" className={shared.primaryBtn} disabled={length < MIN_CHARS}>
                            Check how I match
                        </button>
                    )}
                </div>
            </form>

            {match && (
                <div className={styles.matchResult} data-testid="job-match">
                    <div className={styles.matchHead}>
                        <span className={styles.matchNum}>{match.match}%</span>
                        <span>{match.verdict}</span>
                    </div>
                    {match.matched_keywords?.length > 0 && (
                        <div>
                            <p className={styles.smallLabel}>In your resume</p>
                            <div className={shared.focusRow}>
                                {match.matched_keywords.map(k => (
                                    <span key={k} className={`${shared.chip} ${shared.chipStrong}`}>
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {match.missing_keywords?.length > 0 && (
                        <div>
                            <p className={styles.smallLabel}>Missing from your resume</p>
                            <div className={shared.focusRow}>
                                {match.missing_keywords.map(k => (
                                    <span key={k} className={`${shared.chip} ${shared.chipWeak}`}>
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {match.strengths?.length > 0 && (
                        <div>
                            <p className={styles.smallLabel}>Where you fit</p>
                            <ul className={styles.list}>
                                {match.strengths.map(s => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {match.gaps?.length > 0 && (
                        <div>
                            <p className={styles.smallLabel}>Gaps</p>
                            <ul className={styles.list}>
                                {match.gaps.map(s => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {match.suggestions?.length > 0 && (
                        <div>
                            <p className={styles.smallLabel}>What to do</p>
                            <ul className={styles.list}>
                                {match.suggestions.map(s => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
