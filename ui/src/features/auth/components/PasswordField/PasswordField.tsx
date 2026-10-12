import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './PasswordField.module.css';

export interface PasswordFieldProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    /** Shown under the field; also wired to `aria-describedby`. */
    hint?: React.ReactNode;
    error?: string;
}

/**
 * A password input with a show/hide toggle.
 *
 * The toggle matters most on the reset page: someone who has just forgotten a password is the
 * person most likely to mistype the new one, and seeing it is cheaper than a second reset.
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({
    label,
    hint,
    error,
    id,
    className = '',
    ...props
}) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = hint || error ? `${inputId}-described` : undefined;
    const [visible, setVisible] = useState(false);

    return (
        <div className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
                {label}
            </label>
            <div className={`${styles.control} ${error ? styles.controlError : ''}`}>
                <input
                    id={inputId}
                    type={visible ? 'text' : 'password'}
                    className={`${styles.input} ${className}`.trim()}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    {...props}
                />
                <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setVisible(v => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    disabled={props.disabled}
                >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {(hint || error) && (
                <span
                    id={describedBy}
                    className={error ? styles.error : styles.hint}
                    role={error ? 'alert' : undefined}
                >
                    {error || hint}
                </span>
            )}
        </div>
    );
};
