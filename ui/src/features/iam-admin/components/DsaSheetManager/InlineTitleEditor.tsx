import React, { useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import styles from './DsaSheetManager.module.css';

export interface InlineTitleEditorProps {
    value: string | null;
    /** Shown when the value is null or empty — an untitled section is legitimate, not missing. */
    placeholder: string;
    /** Rejected with a message when the title is required, as it is on a step. */
    allowEmpty?: boolean;
    onSave: (next: string | null) => Promise<void>;
    /** Extra classes for the rendered title, so a step and a section can read differently. */
    titleClassName?: string;
    disabled?: boolean;
}

/**
 * A title that becomes an input in place.
 *
 * Renaming a step or a section is a one-field edit, and sending the author to a dialog for it
 * turns a two-second fix into four clicks. Enter commits, Escape reverts, and the field keeps
 * whatever was typed if the save fails — a rename that vanishes because the network hiccuped is
 * worse than one that stays on screen asking to be retried.
 */
export const InlineTitleEditor: React.FC<InlineTitleEditorProps> = ({
    value,
    placeholder,
    allowEmpty = false,
    onSave,
    titleClassName = '',
    disabled = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    /**
     * The draft is seeded when editing starts rather than mirrored from `value` in an effect.
     * Mirroring means a refresh landing mid-edit silently replaces what is being typed.
     */
    const startEditing = () => {
        setDraft(value ?? '');
        setIsEditing(true);
    };

    const commit = async () => {
        const trimmed = draft.trim();
        if (!allowEmpty && !trimmed) return;
        if (trimmed === (value ?? '')) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            await onSave(trimmed || null);
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isEditing) {
        return (
            <span className={styles.titleGroup}>
                <span className={`${styles.nodeTitle} ${titleClassName}`.trim()}>
                    {value || <span className={styles.untitled}>{placeholder}</span>}
                </span>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={startEditing}
                    disabled={disabled}
                    title="Rename"
                    aria-label={`Rename ${value || placeholder}`}
                >
                    <Pencil size={13} />
                </button>
            </span>
        );
    }

    return (
        <span className={styles.titleGroup}>
            <input
                ref={inputRef}
                className={styles.inlineInput}
                value={draft}
                autoFocus
                // Selects the existing title so typing replaces it, the usual rename behaviour.
                onFocus={event => event.target.select()}
                disabled={isSaving}
                placeholder={placeholder}
                aria-label="Title"
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        commit();
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        // Stops here: the dialog this may sit inside should not also close.
                        event.stopPropagation();
                        setDraft(value ?? '');
                        setIsEditing(false);
                    }
                }}
            />
            <button
                type="button"
                className={styles.iconBtn}
                onClick={commit}
                disabled={isSaving || (!allowEmpty && !draft.trim())}
                title="Save"
                aria-label="Save title"
            >
                <Check size={13} />
            </button>
            <button
                type="button"
                className={styles.iconBtn}
                onClick={() => {
                    setDraft(value ?? '');
                    setIsEditing(false);
                }}
                disabled={isSaving}
                title="Cancel"
                aria-label="Cancel rename"
            >
                <X size={13} />
            </button>
        </span>
    );
};

export default InlineTitleEditor;
