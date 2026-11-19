import React, { useEffect, useState } from 'react';
import { Briefcase, Clock, FileText, Mic } from 'lucide-react';
import {
    fetchMockAvailability,
    type MockInterviewAvailability,
    type MockInterviewKind,
    type MockInterviewKindInfo
} from '../../api/interview.api';
import styles from '../../styles/Trainer.module.css';

/** What each kind of mock interview covers, in a line. */
const COVERS: Record<MockInterviewKind, string> = {
    RESUME: 'Questions about your resume: your roles, projects and skills.',
    HR: 'About you, why this job, your strengths, and your plans.',
    BEHAVIOURAL: 'Times you worked in a team, solved a problem or handled a hard day.',
    PROJECT: 'One of your projects in depth: what you built and the choices you made.',
    FULL: 'A full round: introduction, resume, technical questions and HR.'
};

const REASONS: Record<string, string> = {
    mock_interview_quota_reached: "You've used this month's mock interviews. More arrive on the 1st.",
    ai_unavailable: 'Mock interviews are not available right now. Please try again later.',
    ai_feature_off: 'Mock interviews are switched off for now.'
};

export interface MockStartRequest {
    info: MockInterviewKindInfo;
    role: string | null;
    useJobDescription: boolean;
}

interface MockInterviewsProps {
    /** True when a job description is saved with the resume; offers to use it. */
    hasJobDescription: boolean;
    /** Changes when the resume changes, so "needs resume" is checked again. */
    refreshKey?: unknown;
    onStart: (request: MockStartRequest) => void;
    onUploadResume: () => void;
}

/** Mock interviews: one card per kind, the role to practise for, and what is left this month. */
export const MockInterviews: React.FC<MockInterviewsProps> = ({ hasJobDescription, refreshKey, onStart, onUploadResume }) => {
    const [availability, setAvailability] = useState<MockInterviewAvailability | null>(null);
    const [error, setError] = useState(false);
    const [role, setRole] = useState('');
    const [useJobDescription, setUseJobDescription] = useState(false);

    useEffect(() => {
        let active = true;
        fetchMockAvailability()
            .then(a => active && setAvailability(a))
            .catch(() => active && setError(true));
        return () => {
            active = false;
        };
    }, [refreshKey]);

    const blocked = availability && !availability.available;

    return (
        <>
            <div className={styles.sectionHead}>
                <div>
                    <h2 className={styles.sectionTitle}>
                        <Briefcase size={18} aria-hidden />
                        Mock interviews
                    </h2>
                    <p className={styles.sectionLead}>
                        A voice interview for the job you want, with feedback on what you said.
                    </p>
                </div>
                {availability && <span className={styles.chip}>{availability.left} left this month</span>}
            </div>

            {error ? (
                <p className={styles.error} role="alert">Could not load mock interviews.</p>
            ) : !availability ? (
                <span className={styles.busy}>
                    <span className={styles.spinner} /> Loading…
                </span>
            ) : (
                <>
                    {blocked && (
                        <p className={styles.muted} role="status">
                            {REASONS[availability.reason ?? ''] ?? 'Mock interviews are not available right now.'}
                        </p>
                    )}
                    <div className={styles.mockOptions}>
                        <label className={styles.field}>
                            Role to practise for (optional)
                            <input value={role} maxLength={120} placeholder="e.g. Data analyst" onChange={e => setRole(e.target.value)} />
                        </label>
                        {hasJobDescription && (
                            <label className={styles.checkRow}>
                                <input type="checkbox" checked={useJobDescription} onChange={e => setUseJobDescription(e.target.checked)} />
                                Use my saved job description
                            </label>
                        )}
                    </div>
                    <div className={styles.mockGrid}>
                        {availability.kinds.map(k => {
                            const missingResume = k.needsResume && !availability.hasResume;
                            return (
                                <div key={k.kind} className={styles.mockCard}>
                                    <div className={styles.mockCardHead}>
                                        <h3 className={styles.mockCardTitle}>{k.label}</h3>
                                        <span className={styles.chip}>
                                            <Clock size={11} aria-hidden /> {k.minutes} min
                                        </span>
                                    </div>
                                    <p className={styles.mockCardText}>{COVERS[k.kind] ?? ''}</p>
                                    {missingResume ? (
                                        <>
                                            <p className={styles.muted}>Needs your resume.</p>
                                            <button type="button" className={styles.secondaryBtn} onClick={onUploadResume}>
                                                <FileText size={14} aria-hidden />
                                                Add your resume
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.primaryBtn}
                                            disabled={Boolean(blocked)}
                                            onClick={() =>
                                                onStart({
                                                    info: k,
                                                    role: role.trim() || null,
                                                    useJobDescription: hasJobDescription && useJobDescription
                                                })
                                            }
                                        >
                                            <Mic size={14} aria-hidden />
                                            Start
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );
};
