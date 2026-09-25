import React from 'react';
import { useInView } from '../../../shared/hooks';
import styles from '../styles/Home.module.css';

interface RevealProps {
    children: React.ReactNode;
    /** Staggers a row of siblings so they arrive one after another rather than all at once. */
    delayMs?: number;
    className?: string;
}

/**
 * Fades and lifts its contents in as they scroll into view.
 *
 * A wrapper rather than a class on each section so the sections themselves stay unchanged — they
 * keep their own layout, and this only owns the arrival. If the wrapper is ever removed, the page
 * renders exactly as it did before.
 *
 * The reduced-motion case is handled in CSS rather than here: the class is still applied, the
 * media query simply makes it a no-op, so there is no state to keep in sync.
 */
export const Reveal: React.FC<RevealProps> = ({ children, delayMs, className = '' }) => {
    const [ref, inView] = useInView<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={`${styles.reveal} ${inView ? styles.revealVisible : ''} ${className}`.trim()}
            style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
        >
            {children}
        </div>
    );
};

export default Reveal;
