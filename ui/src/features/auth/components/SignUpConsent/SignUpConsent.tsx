import React from 'react';
import type { ConsentPurpose } from '../../../privacy/api/privacy.api';
import { CONSENT_LABELS } from '../../../privacy/api/privacy.api';
import styles from './SignUpConsent.module.css';

/**
 * The purposes offered as a choice at signup. ESSENTIAL is not among them — see below.
 *
 * Not exported: nothing outside needs it, and exporting a constant beside a component costs the
 * file its fast-refresh boundary.
 */
const OPTIONAL_SIGNUP_PURPOSES: ConsentPurpose[] = [
    'PRODUCT_ANALYTICS',
    'MARKETING_EMAILS',
    'PERSONALISATION'
];

interface SignUpConsentProps {
    granted: ConsentPurpose[];
    onToggle: (purpose: ConsentPurpose, granted: boolean) => void;
    onOpenPrivacyNotice: () => void;
    disabled?: boolean;
}

/**
 * The itemised notice s.5 requires, shown beside the signup form.
 *
 * Three rules shape this, and each is the kind of thing that gets "simplified" away later:
 *
 * Every box starts unticked. s.6(1) wants consent given by clear affirmative action, and a
 * pre-ticked box is the absence of one — the learner did nothing, and we would be recording that
 * as agreement.
 *
 * The purposes are listed separately rather than rolled into one "I agree to the privacy policy".
 * Consent has to be specific, so bundling analytics and marketing behind a single tick is not
 * consent to either.
 *
 * Running the account is stated rather than offered. Presenting it as a choice when refusing it
 * means not having an account would be theatre; saying plainly that it is part of having an
 * account, and that deleting the account withdraws it, is the honest version.
 */
export const SignUpConsent: React.FC<SignUpConsentProps> = ({
    granted,
    onToggle,
    onOpenPrivacyNotice,
    disabled
}) => (
    <div className={styles.notice}>
        <p className={styles.noticeIntro}>
            To create your account we store your name, email address and what you study, so you can
            sign in and pick up where you left off. That much is part of having an account.
        </p>

        <p className={styles.noticeIntro}>
            These are optional, and separate. Leave them off and nothing about your account
            changes — you can turn any of them on or off later from your account page.
        </p>

        <div className={styles.options}>
            {OPTIONAL_SIGNUP_PURPOSES.map(purpose => (
                <label className={styles.option} key={purpose}>
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={granted.includes(purpose)}
                        disabled={disabled}
                        onChange={e => onToggle(purpose, e.target.checked)}
                    />
                    <span className={styles.optionText}>
                        <span className={styles.optionTitle}>{CONSENT_LABELS[purpose].title}</span>
                        <span className={styles.optionDescription}>
                            {CONSENT_LABELS[purpose].description}
                        </span>
                    </span>
                </label>
            ))}
        </div>

        <p className={styles.noticeFooter}>
            Creating an account means you have read our{' '}
            <button type="button" className={styles.inlineLink} onClick={onOpenPrivacyNotice}>
                privacy notice
            </button>
            , which explains what we collect, why, and how to have it corrected or deleted.
        </p>
    </div>
);
