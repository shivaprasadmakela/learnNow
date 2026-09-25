import React from 'react';
import { Button, Input } from '../../../../shared/components';
import type { ConsentPurpose } from '../../../privacy/api/privacy.api';
import { SignUpConsent } from '../SignUpConsent';
import styles from '../../styles/LoginPage.module.css';

interface SignUpFormProps {
    firstName: string;
    setFirstName: (val: string) => void;
    lastName: string;
    setLastName: (val: string) => void;
    email: string;
    setEmail: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    passwordConfirmation: string;
    setPasswordConfirmation: (val: string) => void;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onToggleAuthMode: () => void;
    /** Optional DPDP purposes the learner has ticked. Empty until they tick something. */
    consents: ConsentPurpose[];
    onToggleConsent: (purpose: ConsentPurpose, granted: boolean) => void;
    onOpenPrivacyNotice: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    loading,
    onSubmit,
    onToggleAuthMode,
    consents,
    onToggleConsent,
    onOpenPrivacyNotice
}) => {
    return (
        <form onSubmit={onSubmit} className={styles.authForm}>
            <div className={styles.inputGrid}>
                <Input
                    type="text"
                    placeholder="First name*"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                />
                <Input
                    type="text"
                    placeholder="Last name*"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                />
            </div>

            <Input
                type="email"
                placeholder="Email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
            />

            <div className={styles.inputGrid}>
                <Input
                    type="password"
                    placeholder="Password*"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
                <Input
                    type="password"
                    placeholder="Password confirmation*"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    disabled={loading}
                />
            </div>

            <SignUpConsent
                granted={consents}
                onToggle={onToggleConsent}
                onOpenPrivacyNotice={onOpenPrivacyNotice}
                disabled={loading}
            />

            <div className={styles.actionsRow}>
                <span className={styles.blueLinkBold} onClick={onToggleAuthMode}>
                    Sign in
                </span>
                <Button type="submit" variant="primary" isLoading={loading}>
                    Sign me up!
                </Button>
            </div>
        </form>
    );
};
