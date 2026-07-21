import React from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, id, className = '', ...props }) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <label htmlFor={checkboxId} className={`${styles.checkboxContainer} ${className}`}>
            <input type="checkbox" id={checkboxId} className={styles.checkboxInput} {...props} />
            <span className={styles.customCheckmark}>
                <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
            {label && <span className={styles.labelText}>{label}</span>}
        </label>
    );
};

export default Checkbox;
