import React, { useState } from 'react';
import { Check, Loader2, AlertCircle, Eye, Edit3 } from 'lucide-react';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
    content: string;
    onChange: (text: string) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    isLoading?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
    content,
    onChange,
    saveStatus,
    isLoading = false
}) => {
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    const renderFormattedMarkdown = (text: string) => {
        if (!text.trim()) {
            return <p className={styles.placeholderText}>No notes added yet for this section.</p>;
        }

        const paragraphs = text.split('\n\n');
        return paragraphs.map((p, idx) => {
            const formatted = p
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
            return <p key={idx} style={{ margin: '0 0 12px 0' }} dangerouslySetInnerHTML={{ __html: formatted }} />;
        });
    };

    return (
        <div className={styles.noteEditorContainer}>
            <div className={styles.noteHeader}>
                <div className={styles.tabGroup}>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === 'edit' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('edit')}
                    >
                        <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Write
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Preview
                    </button>
                </div>

                <div className={styles.actionsRow}>
                    {saveStatus === 'saving' && (
                        <span className={`${styles.saveIndicator} ${styles.statusSaving}`}>
                            <Loader2 size={13} className="animate-spin" /> Saving...
                        </span>
                    )}

                    {saveStatus === 'saved' && (
                        <span className={`${styles.saveIndicator} ${styles.statusSaved}`}>
                            <Check size={13} /> Saved
                        </span>
                    )}

                    {saveStatus === 'error' && (
                        <span className={`${styles.saveIndicator} ${styles.statusError}`}>
                            <AlertCircle size={13} /> Save failed
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.editorBody}>
                {isLoading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading notes...
                    </div>
                ) : activeTab === 'preview' ? (
                    <div className={styles.previewBox}>
                        {renderFormattedMarkdown(content)}
                    </div>
                ) : (
                    <textarea
                        className={styles.textarea}
                        value={content}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Jot down key takeaways, code snippets, or personal reminders here... (Auto-saves automatically)"
                    />
                )}
            </div>
        </div>
    );
};
