import React from 'react';
import { FileText } from 'lucide-react';
import styles from './SubtopicEditorPanel.module.css';
import type { AdminTopicData, AdminSubtopicData } from '../../../api/admin.api';

interface SubtopicEditorPanelProps {
    currentTopic: AdminTopicData | undefined;
    currentSubtopic: AdminSubtopicData | undefined;
    activeTopicIndex: number;
    activeSubtopicIndex: number;
    onSubtopicTitleChange: (topicIdx: number, subtopicIdx: number, value: string) => void;
    onSubtopicContentChange: (topicIdx: number, subtopicIdx: number, value: string) => void;
}

export const SubtopicEditorPanel: React.FC<SubtopicEditorPanelProps> = ({
    currentTopic,
    currentSubtopic,
    activeTopicIndex,
    activeSubtopicIndex,
    onSubtopicTitleChange,
    onSubtopicContentChange,
}) => {
    if (!currentSubtopic) {
        return (
            <div className={styles.emptyPanel}>
                <FileText size={40} className={styles.emptyIcon} />
                <p className={styles.emptyText}>Select a subtopic from the curriculum to start editing</p>
            </div>
        );
    }

    return (
        <div className={styles.panel}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>
                    <i className="fa-solid fa-dove" style={{ marginRight: '6px', fontSize: '0.85rem', color: 'var(--tech-blue)' }} aria-hidden="true" />
                    {currentTopic?.title} › Subtopic {activeSubtopicIndex + 1}
                </span>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="subtopic-title">Subtopic Title</label>
                <input
                    id="subtopic-title"
                    type="text"
                    className={styles.inputField}
                    value={currentSubtopic.title}
                    onChange={e => onSubtopicTitleChange(activeTopicIndex, activeSubtopicIndex, e.target.value)}
                    placeholder="Enter subtopic title..."
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="subtopic-content">Markdown Content</label>
                <textarea
                    id="subtopic-content"
                    className={styles.contentTextarea}
                    value={currentSubtopic.content}
                    onChange={e => onSubtopicContentChange(activeTopicIndex, activeSubtopicIndex, e.target.value)}
                    placeholder="Write markdown content here..."
                    spellCheck={false}
                />
            </div>
        </div>
    );
};
