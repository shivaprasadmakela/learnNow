import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { checkResumeFile, uploadResume, type Resume } from '../../api/resume.api';
import styles from '../../styles/Trainer.module.css';

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface ResumeUploadProps {
    /** The first upload asks the learner to confirm they are 18 or older. */
    firstUpload: boolean;
    defaultRole?: string | null;
    analysesLeft: number | null;
    onUploaded: (resume: Resume) => void;
    onCancel?: () => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ firstUpload, defaultRole, analysesLeft, onUploaded, onCancel }) => {
    const [file, setFile] = useState<File | null>(null);
    const [role, setRole] = useState(defaultRole ?? '');
    const [adult, setAdult] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const outOfAnalyses = analysesLeft !== null && analysesLeft <= 0;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        const problem = checkResumeFile(file);
        if (problem) {
            setError(problem);
            return;
        }
        setUploading(true);
        setError(null);
        try {
            // A replacement was already confirmed on the first upload; the server still asks for it each time.
            onUploaded(await uploadResume(file, role.trim() || null, firstUpload ? adult : true));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not read your resume. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className={styles.field}>
                Your resume (PDF or .docx, up to 5 MB)
                <input
                    type="file"
                    accept={ACCEPT}
                    disabled={uploading}
                    onChange={e => {
                        const picked = e.target.files?.[0] ?? null;
                        setFile(picked);
                        setError(picked ? checkResumeFile(picked) : null);
                    }}
                />
            </label>
            <label className={styles.field}>
                Role you are aiming for (optional)
                <input value={role} maxLength={120} placeholder="e.g. Java backend developer" disabled={uploading} onChange={e => setRole(e.target.value)} />
            </label>
            {firstUpload && (
                <label className={styles.checkRow}>
                    <input type="checkbox" checked={adult} disabled={uploading} onChange={e => setAdult(e.target.checked)} required />
                    I am 18 or older.
                </label>
            )}
            <p className={styles.muted}>
                We read the file once and do not keep it. We keep the text read from it and the review, and you can delete them any time.
                {analysesLeft !== null && ` ${analysesLeft} ${analysesLeft === 1 ? 'review' : 'reviews'} left this month.`}
            </p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.actions}>
                {uploading ? (
                    <span className={styles.busy} role="status">
                        <span className={styles.spinner} /> Reading your resume… this takes about 20 seconds.
                    </span>
                ) : (
                    <>
                        <button
                            type="submit"
                            className={styles.primaryBtn}
                            disabled={!file || (firstUpload && !adult) || outOfAnalyses || Boolean(error)}
                        >
                            <Upload size={14} aria-hidden />
                            Review my resume
                        </button>
                        {onCancel && (
                            <button type="button" className={styles.secondaryBtn} onClick={onCancel}>
                                Cancel
                            </button>
                        )}
                    </>
                )}
            </div>
        </form>
    );
};
