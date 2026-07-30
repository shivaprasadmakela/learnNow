import React, { useRef, useEffect } from 'react';
import { FileText, X, Save, Check, Loader2 } from 'lucide-react';
import styles from './SubtopicNotesPanel.module.css';

interface SubtopicNotesPanelProps {
    isOpen: boolean;
    content: string;
    onChange: (text: string) => void;
    onSave: () => void;
    onClose: () => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    isLoading?: boolean;
}

export const SubtopicNotesPanel: React.FC<SubtopicNotesPanelProps> = ({
    isOpen,
    content,
    onChange,
    onSave,
    onClose,
    saveStatus,
    isLoading = false
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow textarea height dynamically with content up to max screen limit
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const maxHeight = Math.max(250, window.innerHeight - 260);
            const calculatedHeight = Math.max(130, Math.min(textareaRef.current.scrollHeight, maxHeight));
            textareaRef.current.style.height = `${calculatedHeight}px`;
        }
    }, [content, isOpen]);

    return (
        <aside
            className={`${styles.notesSideSlider} ${isOpen ? styles.notesSideSliderOpen : ''}`}
            aria-label="Subtopic Notes Slider"
        >
            <div className={styles.notesPanelHeader}>
                <div className={styles.notesPanelTitle}>
                    <FileText size={16} style={{ color: 'var(--tech-blue)' }} />
                    <span>Subtopic Notes</span>
                </div>

                <button
                    type="button"
                    className={styles.notesCloseBtn}
                    onClick={onClose}
                    title="Close Notes Panel"
                >
                    <X size={16} />
                </button>
            </div>

            <div className={styles.notesPanelBody}>
                {isLoading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading notes...
                    </div>
                ) : (
                    <>
                        <textarea
                            ref={textareaRef}
                            className={styles.plainTextarea}
                            value={content}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Type your notes, reminders, or code snippets for this section..."
                        />
                        <div className={styles.notesPanelFooter}>
                            <span className={styles.statusText}>
                                {saveStatus === 'saving' && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--tech-blue)' }}>
                                        <Loader2 size={12} className="animate-spin" /> Saving...
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--tech-green)' }}>
                                        <Check size={12} /> Saved
                                    </span>
                                )}
                            </span>

                            <button
                                type="button"
                                className={styles.saveNoteBtn}
                                onClick={onSave}
                                disabled={saveStatus === 'saving'}
                            >
                                <Save size={14} />
                                <span>Save Note</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
};
