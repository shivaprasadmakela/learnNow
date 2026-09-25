import React, { useState } from 'react';
import { Button } from '../../../shared/components';
import { useToast } from '../../../shared/components/feedback/Toast';
import { downloadMyData, eraseAccount } from '../../privacy/api/privacy.api';
import styles from '../pages/ProfilePage/ProfilePage.module.css';

interface YourDataSectionProps {
    /** Called once the account is gone, so the app can clear its session and route away. */
    onAccountErased: () => void;
}

/**
 * Access and erasure: s.11 and s.12(3).
 *
 * Deletion asks the learner to type DELETE rather than clicking a second button. The action is
 * irreversible and takes their whole learning history with it, so the confirmation should require
 * reading — a second button is dismissed by the same reflex that pressed the first.
 */
export const YourDataSection: React.FC<YourDataSectionProps> = ({ onAccountErased }) => {
    const { showToast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isErasing, setIsErasing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        try {
            await downloadMyData();
            showToast('Your data is downloading.', 'success');
        } catch {
            setError('We could not build your export. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleErase = async () => {
        setIsErasing(true);
        setError(null);
        try {
            await eraseAccount();
            onAccountErased();
        } catch {
            setError('We could not delete your account. Nothing has been changed.');
            setIsErasing(false);
        }
    };

    return (
        <>
            <section className={styles.section}>
                <span className={styles.lawRef}>DPDP s.11 · Access</span>
                <h2 className={styles.sectionTitle}>Your data</h2>
                <p className={styles.sectionIntro}>
                    You can take a copy of everything we hold about you, whenever you want, without
                    asking us first.
                </p>

                <div className={styles.actionRow}>
                    <div className={styles.actionText}>
                        <h3 className={styles.actionTitle}>Download a copy</h3>
                        <p className={styles.actionDescription}>
                            A single JSON file containing your account details, consent history,
                            progress, quiz attempts, notes, bookmarks, DSA submissions and any
                            grievances you have raised. Your password is not included — we cannot
                            read it either.
                        </p>
                    </div>
                    <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? 'Preparing…' : 'Download'}
                    </Button>
                </div>
            </section>

            <section className={`${styles.section} ${styles.dangerZone}`}>
                <span className={styles.lawRef}>DPDP s.12 · Erasure</span>
                <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>
                    Delete your account
                </h2>
                <p className={styles.sectionIntro}>
                    This erases your account and everything attached to it — progress, notes,
                    bookmarks, submissions, consent records and grievances. It happens immediately
                    and cannot be undone.
                </p>
                <p className={styles.sectionIntro}>
                    One thing is kept. If you have donated, the payment record stays, because tax
                    and audit law requires us to keep it. Your name, email address and message are
                    removed from it, so what remains is an amount and a date that no longer points
                    at you.
                </p>

                {!isConfirming ? (
                    <button className={styles.dangerButton} onClick={() => setIsConfirming(true)}>
                        Delete my account
                    </button>
                ) : (
                    <div className={styles.fieldGrid}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="confirm-delete">
                                Type DELETE to confirm
                            </label>
                            <input
                                id="confirm-delete"
                                className={styles.input}
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                autoComplete="off"
                                placeholder="DELETE"
                            />
                        </div>
                        <div className={styles.actions}>
                            <button
                                className={styles.dangerButton}
                                disabled={confirmText !== 'DELETE' || isErasing}
                                onClick={handleErase}
                            >
                                {isErasing ? 'Deleting…' : 'Permanently delete'}
                            </button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIsConfirming(false);
                                    setConfirmText('');
                                }}
                                disabled={isErasing}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {error && <p className={styles.inlineError}>{error}</p>}
            </section>
        </>
    );
};
