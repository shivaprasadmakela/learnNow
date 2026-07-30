import React from 'react';
import { X, FileText } from 'lucide-react';
import { NoteEditor } from '../NoteEditor';
import styles from './NoteDrawer.module.css';

interface NoteDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    subtopicTitle?: string;
    content: string;
    onChange: (text: string) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    isLoading?: boolean;
}

export const NoteDrawer: React.FC<NoteDrawerProps> = ({
    isOpen,
    onClose,
    subtopicTitle,
    content,
    onChange,
    saveStatus,
    isLoading = false
}) => {
    return (
        <>
            {/* Dark blur backdrop */}
            <div
                className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-over side panel */}
            <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} role="dialog" aria-label="Personal Notes">
                <div className={styles.drawerHeader}>
                    <div className={styles.headerTitleGroup}>
                        <FileText size={18} style={{ color: 'var(--tech-blue)' }} />
                        <div>
                            <h3 className={styles.drawerTitle}>Personal Notes</h3>
                            {subtopicTitle && (
                                <div className={styles.subtopicLabel} title={subtopicTitle}>
                                    Section: {subtopicTitle}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close Notes Panel"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.drawerBody}>
                    <NoteEditor
                        content={content}
                        onChange={onChange}
                        saveStatus={saveStatus}
                        isLoading={isLoading}
                    />
                </div>
            </aside>
        </>
    );
};

export interface NoteTriggerProps {
    isOpen?: boolean;
    onToggle: () => void;
    hasNote?: boolean;
}

export const NotesHeaderTrigger: React.FC<NoteTriggerProps> = ({
    isOpen = false,
    onToggle,
    hasNote = false
}) => {
    return (
        <button
            type="button"
            className={`${styles.headerNotesTrigger} ${isOpen ? styles.headerNotesTriggerActive : ''}`}
            onClick={onToggle}
            title="Toggle Personal Notes Drawer"
        >
            <FileText size={14} />
            <span>Notes</span>
            {hasNote && <span className={styles.hasNoteDot} title="Notes saved for this section" />}
        </button>
    );
};

export const NotesFloatingTrigger: React.FC<NoteTriggerProps> = ({
    onToggle,
    hasNote = false
}) => {
    return (
        <button
            type="button"
            className={styles.floatingFab}
            onClick={onToggle}
            title="Open Personal Notes"
        >
            <FileText size={16} style={{ color: 'var(--tech-blue)' }} />
            <span>Notes</span>
            {hasNote && <span className={styles.hasNoteDot} style={{ top: '6px', right: '6px' }} />}
        </button>
    );
};
