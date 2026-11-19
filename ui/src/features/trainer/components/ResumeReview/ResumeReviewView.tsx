import React, { useState } from 'react';
import { ArrowDown, Check, Copy } from 'lucide-react';
import type { IssueSeverity, ResumeReview } from '../../api/resume.api';
import shared from '../../styles/Trainer.module.css';
import styles from './ResumeReview.module.css';

const SCORES: { key: keyof ResumeReview['scores']; label: string; hint: string }[] = [
    { key: 'ats', label: 'Easy for hiring software', hint: 'Can screening software read it?' },
    { key: 'impact', label: 'Impact', hint: 'Does it show results, not only duties?' },
    { key: 'clarity', label: 'Clarity', hint: 'Is it easy to read?' },
    { key: 'skills', label: 'Skills', hint: 'Do your skills fit the role?' }
];

const SEVERITIES: { key: IssueSeverity; label: string }[] = [
    { key: 'high', label: 'Fix first' },
    { key: 'medium', label: 'Worth fixing' },
    { key: 'low', label: 'Small things' }
];

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard blocked; the text is still on screen to select */
        }
    };
    return (
        <button type="button" className={shared.secondaryBtn} onClick={copy} aria-label="Copy the improved line">
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
};

/** The review of a resume: scores, what is good, what to fix, ready rewrites and missing sections. */
export const ResumeReviewView: React.FC<{ review: ResumeReview }> = ({ review }) => (
    <div className={styles.review}>
        <div className={styles.scoreRow}>
            <div className={styles.overall}>
                <span className={styles.overallNum}>{review.overall}</span>
                <span className={styles.overallLabel}>out of 100</span>
            </div>
            <div className={styles.scores}>
                {SCORES.map(s => {
                    const value = Math.max(0, Math.min(10, review.scores?.[s.key] ?? 0));
                    return (
                        <div key={s.key} className={styles.score}>
                            <div className={styles.scoreHead}>
                                <span title={s.hint}>{s.label}</span>
                                <span>{value}/10</span>
                            </div>
                            <div className={shared.bar} role="progressbar" aria-label={s.label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={10}>
                                <span className={shared.barFill} style={{ width: `${value * 10}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {review.summary && <p className={styles.summary}>{review.summary}</p>}

        {review.strengths?.length > 0 && (
            <div>
                <h3 className={styles.subTitle}>What works</h3>
                <ul className={styles.list}>
                    {review.strengths.map(s => (
                        <li key={s}>{s}</li>
                    ))}
                </ul>
            </div>
        )}

        {review.issues?.length > 0 && (
            <div>
                <h3 className={styles.subTitle}>What to fix</h3>
                {SEVERITIES.map(sev => {
                    const issues = review.issues.filter(i => i.severity === sev.key);
                    if (issues.length === 0) return null;
                    return (
                        <div key={sev.key} className={styles.issueGroup}>
                            <span className={`${shared.chip} ${sev.key === 'high' ? shared.chipWeak : sev.key === 'medium' ? shared.chipOkay : ''}`}>
                                {sev.label}
                            </span>
                            <ul className={styles.issues}>
                                {issues.map(i => (
                                    <li key={i.title}>
                                        <strong>{i.title}</strong>
                                        {i.detail && <span>{i.detail}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        )}

        {review.rewrites?.length > 0 && (
            <div>
                <h3 className={styles.subTitle}>Lines you could use</h3>
                <p className={shared.muted}>
                    Brackets like [X%] are for you to fill in with your real numbers. If you don't have a real number, leave it out.
                </p>
                <ul className={styles.rewrites}>
                    {review.rewrites.map(r => (
                        <li key={r.original} className={styles.rewrite}>
                            <p className={styles.original}>{r.original}</p>
                            <ArrowDown size={14} aria-hidden className={styles.arrow} />
                            <p className={styles.improved}>{r.improved}</p>
                            {r.why && <p className={shared.muted}>{r.why}</p>}
                            <div>
                                <CopyButton text={r.improved} />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {review.missing_sections?.length > 0 && (
            <div>
                <h3 className={styles.subTitle}>Sections to add</h3>
                <div className={shared.focusRow}>
                    {review.missing_sections.map(m => (
                        <span key={m} className={shared.chip}>
                            {m}
                        </span>
                    ))}
                </div>
            </div>
        )}
    </div>
);
