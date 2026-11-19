import React, { useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { deleteResume, type Resume } from '../../api/resume.api';
import { shortDate } from '../../utils/trainerText';
import { ResumeUpload } from './ResumeUpload';
import { ResumeReviewView } from './ResumeReviewView';
import { ResumeProfileCard } from './ResumeProfileCard';
import { JobMatchBox } from './JobMatchBox';
import shared from '../../styles/Trainer.module.css';
import styles from './ResumeReview.module.css';

interface ResumeSectionProps {
    /** Undefined while loading, null when there is none. */
    resume: Resume | null | undefined;
    onChange: (resume: Resume | null) => void;
    analysesLeft: number | null;
    defaultRole?: string | null;
    loadError?: boolean;
}

/** Upload a resume, read its review, correct what was read, compare it with a job, or delete it. */
export const ResumeSection: React.FC<ResumeSectionProps> = ({ resume, onChange, analysesLeft, defaultRole, loadError }) => {
    const [replacing, setReplacing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remove = async () => {
        setDeleting(true);
        setError(null);
        try {
            await deleteResume();
            setConfirmDelete(false);
            onChange(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete your resume.');
        } finally {
            setDeleting(false);
        }
    };

    const left = resume ? resume.analysesLeftThisMonth : analysesLeft;

    return (
        <>
            <div className={shared.sectionHead}>
                <div>
                    <h2 className={shared.sectionTitle}>
                        <FileText size={18} aria-hidden />
                        Resume review
                    </h2>
                    <p className={shared.sectionLead}>
                        {resume
                            ? `${resume.fileName}, reviewed ${shortDate(resume.analysedAt)}.`
                            : 'Get a score, what to fix, and better lines to use. Mock interviews use it to ask about your work.'}
                    </p>
                </div>
                {resume && !replacing && (
                    <div className={shared.actions}>
                        <button type="button" className={shared.secondaryBtn} onClick={() => setReplacing(true)}>
                            <Upload size={14} aria-hidden />
                            Upload a new version
                        </button>
                        {confirmDelete ? (
                            <>
                                <button type="button" className={`${shared.secondaryBtn} ${shared.dangerText}`} onClick={remove} disabled={deleting}>
                                    {deleting ? 'Deleting…' : 'Yes, delete it'}
                                </button>
                                <button type="button" className={shared.secondaryBtn} onClick={() => setConfirmDelete(false)} disabled={deleting}>
                                    Keep it
                                </button>
                            </>
                        ) : (
                            <button type="button" className={`${shared.secondaryBtn} ${shared.dangerText}`} onClick={() => setConfirmDelete(true)}>
                                <Trash2 size={14} aria-hidden />
                                Delete resume
                            </button>
                        )}
                    </div>
                )}
            </div>
            {confirmDelete && <p className={shared.muted}>This deletes the text we read, the review, your job description and the match.</p>}
            {error && <p className={shared.error} role="alert">{error}</p>}

            {resume === undefined ? (
                loadError ? (
                    <p className={shared.error} role="alert">Could not load your resume.</p>
                ) : (
                    <span className={shared.busy}>
                        <span className={shared.spinner} /> Loading…
                    </span>
                )
            ) : resume === null || replacing ? (
                <ResumeUpload
                    firstUpload={resume === null}
                    defaultRole={resume?.targetRole ?? defaultRole}
                    analysesLeft={left ?? null}
                    onUploaded={r => {
                        setReplacing(false);
                        onChange(r);
                    }}
                    onCancel={replacing ? () => setReplacing(false) : undefined}
                />
            ) : (
                <div className={styles.layout}>
                    <ResumeReviewView review={resume.review} />
                    <div className={styles.side}>
                        <ResumeProfileCard key={resume.analysedAt} resume={resume} onChange={onChange} />
                        <JobMatchBox key={`${resume.analysedAt}-match`} resume={resume} onChange={onChange} />
                    </div>
                </div>
            )}
        </>
    );
};
