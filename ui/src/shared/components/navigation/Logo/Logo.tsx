import React from 'react';
import styles from './Logo.module.css';

export interface LogoProps {
    /** Omit for a non-interactive mark; with it, the whole wordmark becomes the button. */
    onClick?: () => void;
    /** Where the mark is used. `header` is the app bar; `footer` is a touch larger and calmer. */
    variant?: 'header' | 'footer';
    /** Screen-reader name for the clickable form. */
    ariaLabel?: string;
}

/**
 * The learnNow wordmark.
 *
 * Extracted from Header, which was the only thing that had it — the footer then drew its own
 * version in plain text with an accent span, so the same brand appeared two different ways on one
 * page. This is now the single definition of what the wordmark looks like; the gradient, weight
 * and letter-spacing live here and nowhere else.
 */
export const Logo: React.FC<LogoProps> = ({ onClick, variant = 'header', ariaLabel }) => {
    const className = `${styles.logo} ${variant === 'footer' ? styles.logoFooter : ''}`;
    const mark = <span className={styles.logoBrand}>learnNow</span>;

    // A real button when it navigates, a plain span when it does not: a clickable div is
    // unreachable by keyboard, and a button wrapping something inert is noise for a screen reader.
    if (!onClick) {
        return <div className={className}>{mark}</div>;
    }

    return (
        <button type="button" className={className} onClick={onClick} aria-label={ariaLabel}>
            {mark}
        </button>
    );
};

export default Logo;
