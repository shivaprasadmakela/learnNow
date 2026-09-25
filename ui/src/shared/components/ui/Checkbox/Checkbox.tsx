import React, { useId } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * Accepts a node, not just a string, so a label can carry a link — the privacy tick on the
     * signup form needs "I have read the privacy notice" with the notice clickable inside it.
     * A plain string is still a node, so every existing caller is unaffected.
     */
    label?: React.ReactNode;
    /** Lets a long label wrap and sit beside the box rather than being clipped on one line. */
    align?: 'center' | 'start';
}

export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    id,
    className = '',
    align = 'center',
    ...props
}) => {
    /*
     * The id used to be derived from the label text, which only works when the label is a string
     * and produced duplicate ids for two checkboxes sharing a label. useId gives every instance a
     * stable unique one, so htmlFor always points at the right input.
     */
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
        <label
            htmlFor={checkboxId}
            className={`${styles.checkboxContainer} ${
                align === 'start' ? styles.alignStart : ''
            } ${className}`}
        >
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
