import React from 'react';
import type { ButtonProps } from './Button.types';
import styles from './Button.module.css';

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) => {
    const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;

    return (
        <button
            className={buttonClass}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <span className={styles.loader}></span> : children}
        </button>
    );
};
