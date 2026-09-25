import React, { useEffect, useState } from 'react';
import { Button, Input } from '../../../shared/components';
import { useToast } from '../../../shared/components/feedback/Toast';
import {
    deleteNominee,
    fetchNominee,
    saveNominee,
    type NomineeDto
} from '../../privacy/api/privacy.api';
import styles from '../pages/ProfilePage/ProfilePage.module.css';

/**
 * The right to nominate, s.14.
 *
 * The wording on this panel is the hard part rather than the code. It has to explain, without
 * being morbid about it, that this person may exercise these rights if the learner dies or becomes
 * incapable of exercising them — and that nominating someone grants no access at all while the
 * learner is able to act for themselves.
 */
export const NomineeSection: React.FC = () => {
    const { showToast } = useToast();
    const [nominee, setNominee] = useState<NomineeDto | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [relationship, setRelationship] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchNominee()
            .then(data => {
                if (cancelled) return;
                setNominee(data);
                setName(data?.name ?? '');
                setEmail(data?.email ?? '');
                setRelationship(data?.relationship ?? '');
            })
            .catch(() => {
                if (!cancelled) setError('We could not load your nomination.');
            })
            .finally(() => {
                if (!cancelled) setIsLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const saved = await saveNominee({
                name: name.trim(),
                email: email.trim(),
                relationship: relationship.trim() || undefined
            });
            setNominee(saved);
            showToast('Nomination saved.', 'success');
        } catch {
            setError('We could not save that. Please check the name and email address.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await deleteNominee();
            setNominee(null);
            setName('');
            setEmail('');
            setRelationship('');
            showToast('Nomination removed.', 'success');
        } catch {
            setError('We could not remove your nomination.');
        } finally {
            setIsSaving(false);
        }
    };

    const canSave = name.trim().length > 0 && email.trim().length > 0 && !isSaving;

    return (
        <section className={styles.section}>
            <span className={styles.lawRef}>DPDP s.14 · Nomination</span>
            <h2 className={styles.sectionTitle}>Nominate someone</h2>
            <p className={styles.sectionIntro}>
                You can name one person to exercise these rights on your behalf if you die or become
                unable to exercise them yourself. They can then ask us for a copy of your data, or
                ask us to delete it.
            </p>
            <p className={styles.sectionIntro}>
                Naming someone gives them nothing today. They get no account, no access to your
                work, and we do not contact them — it only matters if they come to us in one of
                those situations, and we will verify who they are before acting.
            </p>

            {!isLoaded && <div className={styles.emptyState}>Loading…</div>}

            {isLoaded && (
                <>
                    <div className={styles.fieldGrid}>
                        <Input
                            label="Their full name"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setName(e.target.value)
                            }
                        />
                        <Input
                            label="Their email address"
                            type="email"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEmail(e.target.value)
                            }
                        />
                        <Input
                            label="Relationship to you (optional)"
                            value={relationship}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRelationship(e.target.value)
                            }
                            placeholder="Spouse, parent, friend…"
                        />
                    </div>

                    <div className={styles.actions}>
                        <Button variant="primary" onClick={handleSave} disabled={!canSave}>
                            {nominee ? 'Update nomination' : 'Save nomination'}
                        </Button>
                        {nominee && (
                            <Button
                                variant="secondary"
                                onClick={handleRemove}
                                disabled={isSaving}
                            >
                                Remove
                            </Button>
                        )}
                    </div>

                    {nominee && (
                        <p className={styles.consentMeta}>
                            Last updated {new Date(nominee.updatedAt).toLocaleDateString()}.
                        </p>
                    )}
                </>
            )}

            {error && <p className={styles.inlineError}>{error}</p>}
        </section>
    );
};
