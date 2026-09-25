import React, { useEffect, useState } from 'react';
import { Button, Input } from '../../../shared/components';
import { useToast } from '../../../shared/components/feedback/Toast';
import {
    GRIEVANCE_CATEGORY_LABELS,
    fetchGrievances,
    fetchPrivacyContact,
    raiseGrievance,
    type GrievanceCategory,
    type GrievanceDto,
    type GrievanceStatus,
    type PrivacyContactDto
} from '../../privacy/api/privacy.api';
import styles from '../pages/ProfilePage/ProfilePage.module.css';

const STATUS_CLASS: Record<GrievanceStatus, string> = {
    OPEN: styles.statusOpen,
    IN_PROGRESS: styles.statusInProgress,
    RESOLVED: styles.statusResolved,
    CLOSED: styles.statusClosed
};

const STATUS_LABEL: Record<GrievanceStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
};

/**
 * Grievance redressal, s.13.
 *
 * The past grievances list is not decoration. A learner may only escalate to the Data Protection
 * Board after raising it with us first, so being able to point at what they sent and when is the
 * thing that makes escalation possible.
 *
 * The officer's contact details come from the server rather than being written into this file:
 * they are published under s.8(9), they differ per environment, and a stale address hardcoded in
 * the frontend is the failure this avoids.
 */
export const GrievanceSection: React.FC = () => {
    const { showToast } = useToast();
    const [grievances, setGrievances] = useState<GrievanceDto[]>([]);
    const [contact, setContact] = useState<PrivacyContactDto | null>(null);
    const [category, setCategory] = useState<GrievanceCategory>('DATA_ACCESS');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([fetchGrievances(), fetchPrivacyContact()])
            .then(([list, details]) => {
                if (cancelled) return;
                setGrievances(list);
                setContact(details);
            })
            .catch(() => {
                if (!cancelled) setError('We could not load your past grievances.');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async () => {
        setIsSending(true);
        setError(null);
        try {
            const created = await raiseGrievance({
                category,
                subject: subject.trim(),
                body: body.trim()
            });
            setGrievances(current => [created, ...current]);
            setSubject('');
            setBody('');
            showToast(`Grievance ${created.reference} raised.`, 'success');
        } catch {
            setError('We could not submit that. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const canSubmit = subject.trim().length > 0 && body.trim().length > 0 && !isSending;

    return (
        <section className={styles.section}>
            <span className={styles.lawRef}>DPDP s.13 · Grievance redressal</span>
            <h2 className={styles.sectionTitle}>Raise a concern</h2>
            <p className={styles.sectionIntro}>
                If something about how we handle your data is wrong, tell us here. You will get a
                reference number, and you can follow what happened to it on this page.
            </p>

            <div className={styles.fieldGrid}>
                <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="grievance-category">
                        What is this about?
                    </label>
                    <select
                        id="grievance-category"
                        className={styles.select}
                        value={category}
                        onChange={e => setCategory(e.target.value as GrievanceCategory)}
                    >
                        {(
                            Object.keys(GRIEVANCE_CATEGORY_LABELS) as GrievanceCategory[]
                        ).map(key => (
                            <option key={key} value={key}>
                                {GRIEVANCE_CATEGORY_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Subject"
                    value={subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSubject(e.target.value)
                    }
                    placeholder="A one-line summary"
                />

                <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="grievance-body">
                        What happened?
                    </label>
                    <textarea
                        id="grievance-body"
                        className={styles.textarea}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={5}
                        placeholder="Tell us as much as you can. There is no wrong way to describe it."
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
                    {isSending ? 'Sending…' : 'Raise grievance'}
                </Button>
            </div>

            {error && <p className={styles.inlineError}>{error}</p>}

            {contact && (
                <div className={styles.contactCard}>
                    You can also write to us directly. We aim to respond within{' '}
                    <strong>{contact.grievanceResponseDays} days</strong>.
                    <br />
                    <strong>{contact.grievanceOfficerName}</strong>, {contact.entityName}
                    <br />
                    <a href={`mailto:${contact.grievanceOfficerEmail}`}>
                        {contact.grievanceOfficerEmail}
                    </a>
                    <br />
                    {contact.grievanceOfficerAddress}
                    <br />
                    <br />
                    If you are not satisfied with how we handle it, you may escalate to the Data
                    Protection Board of India.
                </div>
            )}

            {grievances.length > 0 && (
                <div className={styles.grievanceList}>
                    {grievances.map(grievance => (
                        <article className={styles.grievanceCard} key={grievance.reference}>
                            <div className={styles.grievanceHead}>
                                <span className={styles.grievanceRef}>{grievance.reference}</span>
                                <span
                                    className={`${styles.statusBadge} ${STATUS_CLASS[grievance.status]}`}
                                >
                                    {STATUS_LABEL[grievance.status]}
                                </span>
                            </div>
                            <h3 className={styles.grievanceSubject}>{grievance.subject}</h3>
                            <p className={styles.grievanceBody}>{grievance.body}</p>
                            {grievance.response && (
                                <div className={styles.grievanceResponse}>
                                    <strong>Our response:</strong>
                                    <br />
                                    {grievance.response}
                                </div>
                            )}
                            <p className={styles.consentMeta}>
                                Raised {new Date(grievance.createdAt).toLocaleDateString()}
                                {grievance.resolvedAt &&
                                    ` · closed ${new Date(grievance.resolvedAt).toLocaleDateString()}`}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};
