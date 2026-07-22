import React from 'react';
import { Button } from '../../../../shared/components';
import styles from '../../styles/LoginPage.module.css';

interface RegistrationSuccessProps {
    onContinue: () => void;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({ onContinue }) => {
    return (
        <div className={styles.successCardContent}>
            <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: '4rem', color: '#2563eb', marginBottom: '16px' }} aria-hidden="true" />
            <h2 className={styles.successHeading}>Verify your email</h2>
            <p className={styles.successDescription}>
                We have sent a verification link. Please check your inbox (or your local developer console log) to confirm your registration.
            </p>
            <Button variant="primary" onClick={onContinue}>
                Continue to Sign In
            </Button>
        </div>
    );
};
