import React, { useEffect, useState } from 'react';
import { useToast } from '../../../shared/components/feedback/Toast';
import {
    CONSENT_LABELS,
    fetchConsents,
    updateConsents,
    type ConsentCentreDto,
    type ConsentPurpose
} from '../../privacy/api/privacy.api';
import styles from '../pages/ProfilePage/ProfilePage.module.css';

/**
 * The consent centre, s.6.
 *
 * Each toggle saves on the spot. There is no Save button and that is the point: s.6(4) requires
 * withdrawing consent to be as easy as giving it, and a withdrawal that only takes effect after
 * finding and pressing a second button is measurably harder than the tick that granted it.
 *
 * Failure is handled by putting the switch back. A toggle that stays flipped after the request
 * failed tells the learner they have withdrawn consent when they have not, which is the one
 * outcome this screen must never produce.
 */
export const ConsentCentreSection: React.FC = () => {
    const { showToast } = useToast();
    const [centre, setCentre] = useState<ConsentCentreDto | null>(null);
    const [pending, setPending] = useState<ConsentPurpose | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchConsents()
            .then(data => {
                if (!cancelled) setCentre(data);
            })
            .catch(() => {
                if (!cancelled) setError('We could not load your consent settings.');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleToggle = async (purpose: ConsentPurpose, granted: boolean) => {
        setPending(purpose);
        setError(null);
        try {
            const updated = await updateConsents([{ purpose, granted }]);
            setCentre(updated);
            showToast(
                granted
                    ? `Consent given for ${CONSENT_LABELS[purpose].title.toLowerCase()}.`
                    : `Consent withdrawn for ${CONSENT_LABELS[purpose].title.toLowerCase()}.`,
                'success'
            );
        } catch {
            // Re-read rather than trusting local state: the server is the record of what was
            // actually consented to, and this screen must show that rather than the attempt.
            setError('That change did not save. Your settings are unchanged.');
            fetchConsents()
                .then(setCentre)
                .catch(() => undefined);
        } finally {
            setPending(null);
        }
    };

    if (error && !centre) {
        return (
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Consent</h2>
                <p className={styles.inlineError}>{error}</p>
            </section>
        );
    }

    return (
        <section className={styles.section}>
            <span className={styles.lawRef}>DPDP s.6 · Consent</span>
            <h2 className={styles.sectionTitle}>What you have agreed to</h2>
            <p className={styles.sectionIntro}>
                Each of these is a separate decision, and you can change any of them here at any
                time. Turning one off takes effect immediately — you do not have to ask us, and
                there is nothing to confirm.
            </p>

            {!centre && <div className={styles.emptyState}>Loading your settings…</div>}

            {centre?.consents.map(consent => {
                const label = CONSENT_LABELS[consent.purpose];
                const isStale =
                    consent.noticeVersion !== null &&
                    consent.noticeVersion !== centre.currentNoticeVersion;

                return (
                    <div className={styles.consentRow} key={consent.purpose}>
                        <div className={styles.consentText}>
                            <h3 className={styles.consentTitle}>
                                {label.title}
                                {consent.required && (
                                    <span className={styles.requiredTag}>Required</span>
                                )}
                            </h3>
                            <p className={styles.consentDescription}>{label.description}</p>
                            {consent.decidedAt && (
                                <p className={styles.consentMeta}>
                                    {consent.granted ? 'Agreed' : 'Declined'} on{' '}
                                    {new Date(consent.decidedAt).toLocaleDateString()}
                                    {isStale && ' · our privacy notice has changed since'}
                                </p>
                            )}
                        </div>

                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                className={styles.switchInput}
                                checked={consent.granted}
                                disabled={consent.required || pending === consent.purpose}
                                onChange={e => handleToggle(consent.purpose, e.target.checked)}
                                aria-label={label.title}
                            />
                            <span className={styles.switchTrack} />
                        </label>
                    </div>
                );
            })}

            {error && centre && <p className={styles.inlineError}>{error}</p>}
        </section>
    );
};
