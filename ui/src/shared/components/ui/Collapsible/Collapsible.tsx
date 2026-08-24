import React, { useId } from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './Collapsible.module.css';

export interface CollapsibleProps {
    isOpen: boolean;
    onToggle: () => void;
    /**
     * The header's contents. A slot rather than a set of props because the two callers put very
     * different things here — a step's progress bar, a topic's completion ring — and forcing those
     * into one shape would be worse than the duplication it removed.
     */
    header: React.ReactNode;
    children: React.ReactNode;
    /** Describes what expands, for the chevron's accessible name. */
    label?: string;
    className?: string;
    bodyClassName?: string;
    headerClassName?: string;
    /** For callers that drive layout with a custom property, such as a nesting depth. */
    style?: React.CSSProperties;
}

/**
 * One collapsible row.
 *
 * The topic list and the DSA sheet had each grown their own: same chevron rotation, same
 * conditional body, same click-the-row-to-toggle. This owns that and the accessibility that came
 * with only one of them — `aria-expanded`, `aria-controls`, and a chevron that is a real focusable
 * button rather than a div with a click handler.
 *
 * The chevron is the keyboard control and the row is a mouse convenience. That split matters
 * because a header often contains its own buttons and links, and nesting those inside a `<button>`
 * is invalid — so the row cannot be one.
 */
export const Collapsible: React.FC<CollapsibleProps> = ({
    isOpen,
    onToggle,
    header,
    children,
    label,
    className = '',
    bodyClassName = '',
    headerClassName = '',
    style
}) => {
    const bodyId = useId();

    return (
        <section
            className={`${styles.item} ${isOpen ? styles.itemOpen : ''} ${className}`.trim()}
            style={style}
        >
            <div
                className={`${styles.headerRow} ${headerClassName}`.trim()}
                onClick={onToggle}
                // Not a button: the header may contain links and buttons of its own.
                role="presentation"
            >
                <button
                    type="button"
                    className={`${styles.chevronBtn} ${isOpen ? styles.chevronOpen : ''}`}
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    aria-label={
                        label ? `${isOpen ? 'Collapse' : 'Expand'} ${label}` : undefined
                    }
                    onClick={event => {
                        // The row toggles too; without this the click lands twice and cancels out.
                        event.stopPropagation();
                        onToggle();
                    }}
                >
                    <ChevronRight size={18} />
                </button>

                <div className={styles.headerContent}>{header}</div>
            </div>

            {isOpen && (
                <div id={bodyId} className={`${styles.body} ${bodyClassName}`.trim()}>
                    {children}
                </div>
            )}
        </section>
    );
};

export default Collapsible;
