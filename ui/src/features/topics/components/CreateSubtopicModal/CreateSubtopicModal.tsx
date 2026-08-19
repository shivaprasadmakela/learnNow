import React, { useState } from 'react';
import { X, FileCode, FormInput, Plus, Sparkles } from 'lucide-react';
import styles from './CreateSubtopicModal.module.css';

interface SubtopicOptionData {
    title: string;
    content: string;
    level?: string;
    track?: string;
    estimatedMinutes?: number;
    videoUrl?: string;
    questions?: any[];
}

interface CreateSubtopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    topics: { id: string | number; title: string }[];
    onAddSubtopic: (targetTopicId: string | number, subtopicData: SubtopicOptionData | SubtopicOptionData[]) => Promise<boolean>;
}

const SAMPLE_SUBTOPIC_JSON = `{
  "title": "OAuth2 Implementation & Grant Types",
  "content": "### OAuth2 Grant Types\\n\\nLearn Authorization Code Grant, PKCE, and Client Credentials...",
  "level": "Intermediate",
  "track": "hands-on",
  "estimatedMinutes": 15,
  "videoUrl": "",
  "questions": []
}`;

export const CreateSubtopicModal: React.FC<CreateSubtopicModalProps> = ({
    isOpen,
    onClose,
    topics,
    onAddSubtopic
}) => {
    const [mode, setMode] = useState<'form' | 'json'>('form');
    const [selectedTopicId, setSelectedTopicId] = useState<string | number>(topics[0]?.id || '');

    // Form fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [track, setTrack] = useState('conceptual');
    const [estimatedMinutes, setEstimatedMinutes] = useState(15);
    const [videoUrl, setVideoUrl] = useState('');

    // Raw JSON field
    const [jsonInput, setJsonInput] = useState('');

    if (!isOpen) return null;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetId = selectedTopicId || topics[0]?.id;
        if (!targetId) return;

        const subtopicObj: SubtopicOptionData = {
            title: title.trim() || 'New Subtopic',
            content: content.trim() || '### Section Overview\n\nAdd section content and details here.',
            level,
            track,
            estimatedMinutes: Number(estimatedMinutes) || 15,
            videoUrl: videoUrl.trim() || undefined,
            questions: []
        };

        const success = await onAddSubtopic(targetId, subtopicObj);
        if (success) {
            onClose();
        }
    };

    const handleJsonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetId = selectedTopicId || topics[0]?.id;
        if (!targetId) return;

        try {
            const parsed = JSON.parse(jsonInput);
            const success = await onAddSubtopic(targetId, parsed);
            if (success) {
                onClose();
            }
        } catch {
            // Error handled in parent handler
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Add New Subtopic / Lesson</h2>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Topic Selector */}
                <div className={styles.formGroupFull}>
                    <label className={styles.label}>Select Parent Topic *</label>
                    <select
                        className={styles.select}
                        value={selectedTopicId}
                        onChange={e => setSelectedTopicId(e.target.value)}
                    >
                        {topics.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mode Selector Tabs */}
                <div className={styles.modeTabs}>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${mode === 'form' ? styles.tabBtnActive : ''}`}
                        onClick={() => setMode('form')}
                    >
                        <FormInput size={15} />
                        Regular Form
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${mode === 'json' ? styles.tabBtnActive : ''}`}
                        onClick={() => setMode('json')}
                    >
                        <FileCode size={15} />
                        Paste Raw JSON
                    </button>
                </div>

                {mode === 'form' ? (
                    <form onSubmit={handleFormSubmit} className={styles.formGrid}>
                        <div className={styles.formGroupFull}>
                            <label className={styles.label}>Subtopic / Lesson Title *</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. JWT Refresh Tokens & Invalidation"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Difficulty Level</label>
                            <select className={styles.select} value={level} onChange={e => setLevel(e.target.value)}>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Track Type</label>
                            <select className={styles.select} value={track} onChange={e => setTrack(e.target.value)}>
                                <option value="conceptual">Conceptual</option>
                                <option value="hands-on">Hands-on Code</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Estimated Minutes</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={estimatedMinutes}
                                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                                min={1}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Video URL (Optional)</label>
                            <input
                                type="url"
                                className={styles.input}
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>

                        <div className={styles.formGroupFull}>
                            <label className={styles.label}>Markdown Body Content</label>
                            <textarea
                                className={styles.textarea}
                                rows={5}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Enter subtopic markdown content here..."
                            />
                        </div>

                        <div className={styles.footer} style={{ gridColumn: 'span 2' }}>
                            <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn}>
                                <Plus size={15} />
                                Add Subtopic
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleJsonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className={styles.jsonToolbar}>
                            <span className={styles.label}>Paste Subtopic JSON payload</span>
                            <button
                                type="button"
                                className={styles.sampleJsonBtn}
                                onClick={() => setJsonInput(SAMPLE_SUBTOPIC_JSON)}
                            >
                                <Sparkles size={12} style={{ marginRight: '4px' }} />
                                Insert Sample Subtopic JSON
                            </button>
                        </div>

                        <textarea
                            className={styles.jsonTextarea}
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                            placeholder='{\n  "title": "Subtopic Name",\n  "content": "Markdown text..."\n}'
                        />

                        <div className={styles.footer}>
                            <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn} disabled={!jsonInput.trim()}>
                                <FileCode size={15} />
                                Import & Attach Subtopic
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
