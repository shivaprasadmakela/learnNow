import React from 'react';
import { Checkbox } from '../../../../shared/components';
import styles from './SignUpConsent.module.css';

interface SignUpConsentProps {
    accepted: boolean;
    onChange: (accepted: boolean) => void;
    onOpenPrivacyNotice: () => void;
    disabled?: boolean;
}

/**
 * One tick confirming the privacy notice was read.
 *
 * <b>It grants nothing optional.</b> It confirms the notice was given, which is what s.5 asks for;
 * the account itself is consented to by creating it. Analytics, course email and recommendations
 * stay off until the learner turns them on in the consent centre.
 *
 * That separation is the point, and it is the thing to preserve if this is ever simplified again.
 * s.6(1) requires consent to be specific, so one tick covering the account *and* three unrelated
 * purposes would not be consent to any of them. One tick is fine precisely because it is one
 * thing.
 *
 * The notice is linked rather than reproduced here. s.5 requires it to be given, not to be
 * inlined, and a wall of text above the submit button is read by nobody — the link is one click
 * away and the page it opens says everything this used to repeat.
 */
export const SignUpConsent: React.FC<SignUpConsentProps> = ({
    accepted,
    onChange,
    onOpenPrivacyNotice,
    disabled
}) => (
    <Checkbox
        className={styles.consentCheckbox}
        checked={accepted}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        label={
            <>
                I have read the{' '}
                <button
                    type="button"
                    className={styles.inlineLink}
                    onClick={onOpenPrivacyNotice}
                    // The link sits inside the checkbox's own <label>, so a click on it would
                    // otherwise toggle the box on its way to opening the notice.
                    onClickCapture={e => e.preventDefault()}
                >
                    privacy notice
                </button>
                .
            </>
        }
    />
);
