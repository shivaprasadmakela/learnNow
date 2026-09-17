import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Rendered as the dialog's accessible name. Omit only when `ariaLabel` is given instead. */
    title?: React.ReactNode;
    /** For a dialog whose header is fully custom. */
    ariaLabel?: string;
    /** Sits under the title — a slug, a status line, a count. */
    subtitle?: React.ReactNode;
    /** Goes in the header, before the close button: tabs, a badge, a save button. */
    headerExtra?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    /** See Modal.module.css. `full` is for a dialog holding a whole workspace. */
    size?: ModalSize;
    /**
     * Off for a dialog holding unsaved edits, where a stray click on the backdrop should not
     * discard them. Escape is disabled with it, for the same reason.
     */
    closeOnBackdrop?: boolean;
    className?: string;
    bodyClassName?: string;
}

/**
 * One modal dialog for the whole application.
 *
 * <p>This replaced eight hand-rolled overlays. They had each grown the same fixed backdrop, the
 * same centred card and the same `stopPropagation` on the card, and not one of them had the parts
 * that are easy to leave out: `role="dialog"`, `aria-modal`, an Escape key handler, a scroll lock
 * on the body, focus moved into the dialog on open and returned to the trigger on close.
 *
 * Rendered through a portal rather than in place. An overlay nested inside a positioned or
 * `overflow: hidden` ancestor is clipped by it, which is how a modal ends up cropped to the panel
 * that opened it.
 */
export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    ariaLabel,
    subtitle,
    headerExtra,
    footer,
    children,
    size = 'md',
    closeOnBackdrop = true,
    className = '',
    bodyClassName = ''
}) => {
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement | null>(null);
    /** The element that had focus before opening, so it can be given focus back on close. */
    const restoreFocusTo = useRef<HTMLElement | null>(null);

    const requestClose = useCallback(() => {
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

        restoreFocusTo.current = document.activeElement as HTMLElement | null;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && closeOnBackdrop) {
                event.stopPropagation();
                requestClose();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        // Without this the page behind scrolls when the pointer leaves the dialog.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Deferred a frame: the dialog is not in the DOM yet on the first pass of this effect.
        const focusTimer = window.setTimeout(() => {
            const target = dialogRef.current?.querySelector<HTMLElement>(
                'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
            );
            (target ?? dialogRef.current)?.focus();
        }, 0);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            window.clearTimeout(focusTimer);
            restoreFocusTo.current?.focus?.();
        };
    }, [isOpen, closeOnBackdrop, requestClose]);

    if (!isOpen) return null;

    const hasHeader = Boolean(title || subtitle || headerExtra);

    return createPortal(
        <div
            className={styles.backdrop}
            onMouseDown={event => {
                // mousedown, not click: a click that *starts* inside the dialog and ends on the
                // backdrop — selecting text and releasing outside — would otherwise close it.
                if (closeOnBackdrop && event.target === event.currentTarget) requestClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : ariaLabel}
                tabIndex={-1}
                className={`${styles.dialog} ${styles[size]} ${className}`.trim()}
            >
                {hasHeader && (
                    <header className={styles.header}>
                        <div className={styles.headingGroup}>
                            {title && (
                                <h2 id={titleId} className={styles.title}>
                                    {title}
                                </h2>
                            )}
                            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                        </div>
                        {headerExtra}
                        <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={requestClose}
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </header>
                )}

                <div className={`${styles.body} ${bodyClassName}`.trim()}>{children}</div>

                {footer && <footer className={styles.footer}>{footer}</footer>}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
