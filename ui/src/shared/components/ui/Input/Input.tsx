import React, { useId } from 'react';
import type { InputProps, SelectProps, TextareaProps } from './Input.types';
import styles from './Input.module.css';

/**
 * Wraps a control in the label, hint and error the whole form kit shares.
 *
 * Extracted when the authoring modal needed textareas and selects and found only an input here.
 * Growing a parallel set inside that one feature is how two form styles end up on screen at once.
 */
const Field: React.FC<{
    id: string;
    label?: string;
    hint?: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}> = ({ id, label, hint, error, children }) => (
    <div className={styles.container}>
        {label && (
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
        )}
        {children}
        {/*
          Under the control, not between the label and it. A hint above the input pushes that
          input down while its neighbours in the same grid row stay put, so a row of fields
          where only some carry a hint ends up with its controls at three different heights.
        */}
        {hint && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.errorText}>{error}</span>}
    </div>
);

export const Input: React.FC<InputProps> = ({
    label,
    error,
    hint,
    className = '',
    id,
    ...props
}) => {
    const generatedId = useId();
    // Kept: callers pass an explicit id, and the slugified label was the fallback before useId.
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || generatedId;

    return (
        <Field id={inputId} label={label} hint={hint} error={error}>
            <input
                id={inputId}
                className={`${styles.input} ${error ? styles.inputError : ''} ${className}`.trim()}
                {...props}
            />
        </Field>
    );
};

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    hint,
    mono = false,
    className = '',
    id,
    rows = 4,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <Field id={inputId} label={label} hint={hint} error={error}>
            <textarea
                id={inputId}
                rows={rows}
                className={`${styles.input} ${styles.textarea} ${mono ? styles.mono : ''} ${
                    error ? styles.inputError : ''
                } ${className}`.trim()}
                {...props}
            />
        </Field>
    );
};

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    hint,
    options,
    className = '',
    id,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <Field id={inputId} label={label} hint={hint} error={error}>
            <select
                id={inputId}
                className={`${styles.input} ${styles.select} ${
                    error ? styles.inputError : ''
                } ${className}`.trim()}
                {...props}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Field>
    );
};
