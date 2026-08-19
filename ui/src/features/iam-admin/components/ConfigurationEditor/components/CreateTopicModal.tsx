import React, { useState } from 'react';
import { X, FileCode, FormInput, Plus, Sparkles } from 'lucide-react';
import styles from './CreateTopicModal.module.css';
import type { AdminTopicData } from '../../../api/admin.api';

interface CreateTopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTopic: (topic: AdminTopicData) => void;
    onImportTopicJson: (jsonInput: string) => boolean;
}

const SAMPLE_TOPIC_JSON = `{
  "title": "Spring Boot Security & OAuth2",
  "description": "Learn JWT token generation, OAuth2 social login, and Spring Security filters.",
  "category": "Security",
  "level": "Intermediate",
  "track": "hands-on",
  "duration": "45 mins",
  "status": "DRAFT",
  "subtopics": [
    {
      "title": "JWT Architecture & Tokens",
      "content": "### JWT Core Flow\\n\\nJSON Web Tokens represent claims between two parties...",
      "level": "Intermediate",
      "track": "hands-on",
      "estimatedMinutes": 15,
      "status": "DRAFT",
      "questions": []
    }
  ]
}`;

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
    isOpen,
    onClose,
    onCreateTopic,
    onImportTopicJson,
}) => {
    const [mode, setMode] = useState<'form' | 'json'>('form');

    // Regular Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Backend');
    const [level, setLevel] = useState('Beginner');
    const [track, setTrack] = useState('conceptual');
    const [duration, setDuration] = useState('30 mins');

    // JSON Mode State
    const [jsonContent, setJsonContent] = useState('');

    if (!isOpen) return null;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTopic: AdminTopicData = {
            title: title.trim() || 'New Topic',
            description: description.trim() || 'Topic overview and learning objectives.',
            category: category.trim() || 'Backend',
            level,
            track,
            duration: duration.trim() || '30 mins',
            status: 'DRAFT',
            subtopics: [{
                title: 'Introduction & Overview',
                content: '### Section Overview\n\nAdd section content and code examples here.',
                orderIndex: 1,
                status: 'DRAFT',
            }],
        };
        onCreateTopic(newTopic);
        onClose();
    };

    const handleJsonSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onImportTopicJson(jsonContent);
        if (success) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h2 className={styles.title}>Add New Topic</h2>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
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

                {/* Form Body */}
                {mode === 'form' ? (
                    <form onSubmit={handleFormSubmit} className={styles.formGrid}>
                        <div className={styles.formGroupFull}>
                            <label className={styles.label}>Topic Title *</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Spring Security & OAuth2"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                placeholder="Backend, Core, Security"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Estimated Duration</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                placeholder="e.g. 45 mins"
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

                        <div className={styles.formGroupFull}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                className={styles.textarea}
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brief overview of topic goals..."
                            />
                        </div>

                        <div className={styles.footer} style={{ gridColumn: 'span 2' }}>
                            <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn}>
                                <Plus size={15} />
                                Create Topic
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleJsonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className={styles.jsonToolbar}>
                            <span className={styles.label}>Paste Topic JSON payload</span>
                            <button
                                type="button"
                                className={styles.sampleJsonBtn}
                                onClick={() => setJsonContent(SAMPLE_TOPIC_JSON)}
                            >
                                <Sparkles size={12} style={{ marginRight: '4px' }} />
                                Insert Sample Template
                            </button>
                        </div>

                        <textarea
                            className={styles.jsonTextarea}
                            value={jsonContent}
                            onChange={e => setJsonContent(e.target.value)}
                            placeholder='{\n  "title": "Topic Name",\n  "subtopics": [...]\n}'
                        />

                        <div className={styles.footer}>
                            <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn} disabled={!jsonContent.trim()}>
                                <FileCode size={15} />
                                Import & Attach Topic
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
