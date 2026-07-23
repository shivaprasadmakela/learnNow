import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save, Send, ArrowLeft, Layers, Sparkles } from 'lucide-react';
import styles from './ConfigurationEditor.module.css';
import type { ConfigurationEditorProps } from './ConfigurationEditor.types';
import { fetchAdminPathById, saveAdminPath, publishAdminPath, type AdminPathData, type AdminTopicData, type AdminSubtopicData } from '../../api/admin.api';
import { ContentRenderer } from '../../../../shared/components/content-renderer';
import { useToast } from '../../../../shared/components/feedback/Toast';

export const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({
    pathId,
    onSaveSuccess,
    onCancel
}) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState<boolean>(!!pathId);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Form state
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [category, setCategory] = useState<string>('Backend');
    const [managedBy, setManagedBy] = useState<string>('learnNow');
    const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
    const [topics, setTopics] = useState<AdminTopicData[]>([]);

    // Preview state
    const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);
    const [activeSubtopicIndex, setActiveSubtopicIndex] = useState<number>(0);

    useEffect(() => {
        if (pathId) {
            fetchAdminPathById(pathId)
                .then(data => {
                    setTitle(data.title || '');
                    setDescription(data.description || '');
                    setCategory(data.category || 'Backend');
                    setManagedBy(data.managedBy || 'learnNow');
                    setStatus(data.status || 'DRAFT');
                    setTopics(data.topics || []);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load path', err);
                    showToast('Failed to load path data', 'error');
                    setIsLoading(false);
                });
        }
    }, [pathId, showToast]);

    const handleAddTopic = () => {
        const newTopic: AdminTopicData = {
            title: `New Topic ${topics.length + 1}`,
            description: 'Topic overview and learning goals.',
            category: 'Topic',
            duration: '2 hours',
            status: 'DRAFT',
            subtopics: [
                {
                    title: '1. Introduction & Overview',
                    content: '### Section Overview\n\nAdd section content and details here.',
                    orderIndex: 1,
                    status: 'DRAFT'
                }
            ]
        };
        setTopics([...topics, newTopic]);
        setActiveTopicIndex(topics.length);
        setActiveSubtopicIndex(0);
    };

    const handleRemoveTopic = (index: number) => {
        const updated = topics.filter((_, i) => i !== index);
        setTopics(updated);
        if (activeTopicIndex >= updated.length) {
            setActiveTopicIndex(Math.max(0, updated.length - 1));
        }
    };

    const handleUpdateTopic = (index: number, field: keyof AdminTopicData, value: any) => {
        const updated = [...topics];
        updated[index] = { ...updated[index], [field]: value };
        setTopics(updated);
    };

    const handleAddSubtopic = (topicIndex: number) => {
        const topic = topics[topicIndex];
        const subtopics = topic.subtopics || [];
        const newSubtopic: AdminSubtopicData = {
            title: `${subtopics.length + 1}. New Subtopic`,
            content: '### New Section\n\nEnter subtopic body content here.',
            orderIndex: subtopics.length + 1,
            status: 'DRAFT'
        };
        const updatedTopic = { ...topic, subtopics: [...subtopics, newSubtopic] };
        const updatedTopics = [...topics];
        updatedTopics[topicIndex] = updatedTopic;
        setTopics(updatedTopics);
        setActiveSubtopicIndex(subtopics.length);
    };

    const handleRemoveSubtopic = (topicIndex: number, subtopicIndex: number) => {
        const topic = topics[topicIndex];
        const updatedSubtopics = topic.subtopics.filter((_, i) => i !== subtopicIndex);
        const updatedTopics = [...topics];
        updatedTopics[topicIndex] = { ...topic, subtopics: updatedSubtopics };
        setTopics(updatedTopics);
    };

    const handleUpdateSubtopic = (topicIndex: number, subtopicIndex: number, field: keyof AdminSubtopicData, value: any) => {
        const topic = topics[topicIndex];
        const updatedSubtopics = [...topic.subtopics];
        updatedSubtopics[subtopicIndex] = { ...updatedSubtopics[subtopicIndex], [field]: value };
        const updatedTopics = [...topics];
        updatedTopics[topicIndex] = { ...topic, subtopics: updatedSubtopics };
        setTopics(updatedTopics);
    };

    const handleSaveDraft = async () => {
        if (!title.trim()) {
            showToast('Please enter a course title', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const payload: AdminPathData = {
                id: pathId || undefined,
                title,
                description,
                category,
                managedBy,
                status: 'DRAFT',
                topics
            };
            await saveAdminPath(payload);
            showToast('Course saved as DRAFT successfully!', 'success');
            setIsSaving(false);
            onSaveSuccess();
        } catch (err) {
            console.error('Failed to save draft', err);
            showToast('Failed to save course draft', 'error');
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            showToast('Please enter a course title', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const payload: AdminPathData = {
                id: pathId || undefined,
                title,
                description,
                category,
                managedBy,
                status: 'PUBLISHED',
                topics
            };
            const saved = await saveAdminPath(payload);
            if (saved.id) {
                await publishAdminPath(saved.id);
            }
            showToast('Course PUBLISHED successfully!', 'success');
            setIsSaving(false);
            onSaveSuccess();
        } catch (err) {
            console.error('Failed to publish path', err);
            showToast('Failed to publish course', 'error');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '60px' }}>
                <p>Loading Course Configuration...</p>
            </div>
        );
    }

    const currentTopic = topics[activeTopicIndex];
    const currentSubtopic = currentTopic?.subtopics?.[activeSubtopicIndex];

    return (
        <div className={styles.container}>
            {/* Action Header */}
            <div className={styles.topBar}>
                <div className={styles.titleArea}>
                    <button type="button" className={styles.btnSecondary} onClick={onCancel}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
                            {pathId ? 'Edit Course Configuration' : 'Create New Course Configuration'}
                        </h2>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                            Status: <strong style={{ color: status === 'PUBLISHED' ? 'var(--tech-green)' : '#eab308' }}>{status}</strong>
                        </span>
                    </div>
                </div>
                <div className={styles.actionsArea}>
                    <button type="button" className={styles.btnSecondary} onClick={handleSaveDraft} disabled={isSaving}>
                        <Save size={16} /> Save Draft
                    </button>
                    <button type="button" className={styles.btnSuccess} onClick={handlePublish} disabled={isSaving}>
                        <Send size={16} /> Publish Course
                    </button>
                </div>
            </div>

            {/* Course Metadata Form */}
            <div className={styles.sectionCard}>
                <h3 className={styles.sectionTitle}>Course Details</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Course Title</label>
                        <input
                            type="text"
                            className={styles.inputField}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. System Architecture & Cloud Native Java"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Category</label>
                        <input
                            type="text"
                            className={styles.inputField}
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            placeholder="e.g. Backend, DevOps, Frontend"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Managed By</label>
                        <input
                            type="text"
                            className={styles.inputField}
                            value={managedBy}
                            onChange={e => setManagedBy(e.target.value)}
                            placeholder="e.g. learnNow"
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                        className={styles.textAreaField}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Detailed description of what learners will gain from this path..."
                    />
                </div>
            </div>

            {/* Topics & Subtopics Authoring Studio */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Topics & Subtopics Curriculum</h3>
                    <button type="button" className={styles.btnPrimary} onClick={handleAddTopic}>
                        <Plus size={16} /> Add Topic
                    </button>
                </div>

                {topics.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)' }}>
                        <Layers size={36} style={{ marginBottom: '8px' }} />
                        <p>No topics added yet. Click "Add Topic" to start building your course curriculum.</p>
                    </div>
                ) : (
                    topics.map((topic, tIdx) => (
                        <div key={tIdx} className={styles.topicCard}>
                            <div className={styles.sectionHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={18} color="var(--tech-blue)" />
                                    <strong>Topic #{tIdx + 1}: {topic.title}</strong>
                                </div>
                                <button type="button" className={styles.iconBtnDanger} onClick={() => handleRemoveTopic(tIdx)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Topic Title</label>
                                    <input
                                        type="text"
                                        className={styles.inputField}
                                        value={topic.title}
                                        onChange={e => handleUpdateTopic(tIdx, 'title', e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        className={styles.inputField}
                                        value={topic.duration}
                                        onChange={e => handleUpdateTopic(tIdx, 'duration', e.target.value)}
                                        placeholder="e.g. 2 hours"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Topic Description</label>
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    value={topic.description}
                                    onChange={e => handleUpdateTopic(tIdx, 'description', e.target.value)}
                                />
                            </div>

                            {/* Subtopics Section */}
                            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                                <div className={styles.sectionHeader}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Subtopics ({topic.subtopics?.length || 0})</span>
                                    <button type="button" className={styles.btnSecondary} style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => handleAddSubtopic(tIdx)}>
                                        <Plus size={14} /> Add Subtopic
                                    </button>
                                </div>

                                {topic.subtopics?.map((subtopic, sIdx) => (
                                    <div key={sIdx} className={styles.subtopicCard}>
                                        <div className={styles.sectionHeader}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                Subtopic #{sIdx + 1}
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    className={styles.btnSecondary}
                                                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                                    onClick={() => {
                                                        setActiveTopicIndex(tIdx);
                                                        setActiveSubtopicIndex(sIdx);
                                                    }}
                                                >
                                                    Preview Section
                                                </button>
                                                <button type="button" className={styles.iconBtnDanger} onClick={() => handleRemoveSubtopic(tIdx, sIdx)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
                                            <label>Subtopic Title</label>
                                            <input
                                                type="text"
                                                className={styles.inputField}
                                                value={subtopic.title}
                                                onChange={e => handleUpdateSubtopic(tIdx, sIdx, 'title', e.target.value)}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Markdown Content Body</label>
                                            <textarea
                                                className={styles.textAreaField}
                                                style={{ minHeight: '120px' }}
                                                value={subtopic.content}
                                                onChange={e => handleUpdateSubtopic(tIdx, sIdx, 'content', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Live Content Renderer Preview Pane */}
            {currentSubtopic && (
                <div className={styles.sectionCard}>
                    <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Sparkles size={18} color="var(--tech-blue)" /> Live Learner Preview: {currentSubtopic.title}
                    </h3>
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '1.4rem', margin: '0 0 16px 0' }}>{currentSubtopic.title}</h2>
                        <ContentRenderer
                            blocks={[
                                {
                                    id: 'b-preview',
                                    orderIndex: 1,
                                    type: 'markdown',
                                    body: currentSubtopic.content
                                }
                            ]}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigurationEditor;
