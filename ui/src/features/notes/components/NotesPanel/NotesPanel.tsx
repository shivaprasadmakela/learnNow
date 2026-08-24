import React, { useEffect, useRef } from 'react';
import { Check, FileText, Loader2, Save, X } from 'lucide-react';
import styles from './NotesPanel.module.css';
import type { NoteSaveStatus } from '../../hooks/useNote';

export interface NotesPanelProps {
    content: string;
    onChange: (text: string) => void;
    onSave: () => void;
    saveStatus: NoteSaveStatus;
    isLoading?: boolean;
    title?: string;
    placeholder?: string;
    /**
     * `drawer` slides in from the side and needs `isOpen` and `onClose` — what the study console
     * wants. `inline` fills whatever container it is given, for a pane that is already a tab.
     */
    variant?: 'drawer' | 'inline';
    isOpen?: boolean;
    onClose?: () => void;
}

/**
 * A learner's private note against anything.
 *
 * Was `TopicNotesPanel`, drawer-only. The DSA workspace needed the same editor as an inline pane and
 * had grown its own copy — textarea, save button, status line and all — so the drawer chrome became
 * a variant instead.
 */
export const NotesPanel: React.FC<NotesPanelProps> = ({
    content,
    onChange,
    onSave,
    saveStatus,
    isLoading = false,
    title = 'Notes',
    placeholder,
    variant = 'drawer',
    isOpen = true,
    onClose
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Grow with the content up to what the viewport allows. Inline panels are sized by their
    // container instead, so there is nothing to compute.
    useEffect(() => {
        if (variant !== 'drawer' || !textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        const maxHeight = Math.max(250, window.innerHeight - 260);
        const height = Math.max(130, Math.min(textareaRef.current.scrollHeight, maxHeight));
        textareaRef.current.style.height = `${height}px`;
    }, [content, isOpen, variant]);

    const body = (
        <div className={styles.notesPanelBody}>
            <textarea
                ref={textareaRef}
                className={styles.plainTextarea}
                value={content}
                onChange={event => onChange(event.target.value)}
                placeholder={
                    isLoading
                        ? 'Loading your note...'
                        : (placeholder ??
                          'What tripped you up, what to remember next time...')
                }
                disabled={isLoading}
                aria-label={title}
            />
            <div className={styles.notesPanelFooter}>
                <span className={styles.statusText}>
                    {saveStatus === 'saving' && (
                        <span className={styles.statusSaving}>
                            <Loader2 size={12} /> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className={styles.statusSaved}>
                            <Check size={12} /> Saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className={styles.statusError}>
                            Could not save — try again
                        </span>
                    )}
                    {saveStatus === 'idle' && (
                        <span className={styles.statusHint}>Private to you.</span>
                    )}
                </span>

                <button
                    type="button"
                    className={styles.saveNoteBtn}
                    onClick={onSave}
                    disabled={isLoading || saveStatus === 'saving'}
                >
                    <Save size={14} />
                    <span>Save note</span>
                </button>
            </div>
        </div>
    );

    if (variant === 'inline') {
        return <div className={styles.notesInline}>{body}</div>;
    }

    return (
        <aside
            className={`${styles.notesSideSlider} ${isOpen ? styles.notesSideSliderOpen : ''}`}
            aria-label={title}
        >
            <div className={styles.notesPanelHeader}>
                <div className={styles.notesPanelTitle}>
                    <FileText size={16} style={{ color: 'var(--tech-blue)' }} />
                    <span>{title}</span>
                    {isLoading && (
                        <span className={styles.statusHint}>
                            <Loader2 size={12} /> Loading...
                        </span>
                    )}
                </div>

                {onClose && (
                    <button
                        type="button"
                        className={styles.notesCloseBtn}
                        onClick={onClose}
                        title="Close notes"
                        aria-label="Close notes"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            {body}
        </aside>
    );
};

export default NotesPanel;
