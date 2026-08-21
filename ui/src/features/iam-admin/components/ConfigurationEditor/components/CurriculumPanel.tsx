import React, { useState } from 'react';
import { Plus, Trash2, Library, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './CurriculumPanel.module.css';
import type { AdminTopicData } from '../../../api/admin.api';
import { AttachTopicModal } from './AttachTopicModal';
import { CreateTopicModal } from './CreateTopicModal';

interface CurriculumPanelProps {
    topics: AdminTopicData[];
    activeTopicIndex: number;
    activeSubtopicIndex: number;
    onSelectSubtopic: (topicIdx: number, subtopicIdx: number) => void;
    onAddTopic: (topic?: AdminTopicData) => void;
    onImportTopicJson?: (jsonInput: string) => boolean;
    onAttachExistingTopic?: (topic: AdminTopicData) => void;
    onRemoveTopic: (topicIdx: number) => void;
    onMoveTopicUp?: (topicIdx: number) => void;
    onMoveTopicDown?: (topicIdx: number) => void;
    onUpdateTopicTitle: (topicIdx: number, value: string) => void;
    onUpdateTopicDescription: (topicIdx: number, value: string) => void;
    onAddSubtopic: (topicIdx: number) => void;
    onRemoveSubtopic: (topicIdx: number, subtopicIdx: number) => void;
}

const cleanSubtopicTitle = (title?: string) => {
    if (!title) return 'New Subtopic';
    return title.replace(/^\d+[.)]\s*/, '').replace(/^\d+\.\d+\s*/, '');
};

export const CurriculumPanel: React.FC<CurriculumPanelProps> = ({
    topics,
    activeTopicIndex,
    activeSubtopicIndex,
    onSelectSubtopic,
    onAddTopic,
    onImportTopicJson,
    onAttachExistingTopic,
    onRemoveTopic,
    onMoveTopicUp,
    onMoveTopicDown,
    onUpdateTopicTitle,
    onUpdateTopicDescription,
    onAddSubtopic,
    onRemoveSubtopic,
}) => {
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const existingTopicIds = topics.map(t => t.id).filter((id): id is string => Boolean(id));

    return (
        <section className={styles.panel}>
            <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                    <i className="fa-solid fa-dove" style={{ marginRight: '8px' }} aria-hidden="true" />
                    Curriculum
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {onAttachExistingTopic && (
                        <button
                            type="button"
                            className={styles.addTopicBtn}
                            onClick={() => setIsAttachModalOpen(true)}
                            style={{ background: 'var(--bg-tertiary)', color: 'var(--tech-blue)', border: '1px solid var(--border-color)' }}
                            title="Attach existing topic from library"
                        >
                            <Library size={13} /> Library
                        </button>
                    )}
                    <button type="button" className={styles.addTopicBtn} onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={14} /> Topic
                    </button>
                </div>
            </div>

            {topics.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="fa-solid fa-dove" style={{ fontSize: '2rem', color: 'var(--text-tertiary)' }} aria-hidden="true" />
                    <p>No topics yet. Click <strong>+ Topic</strong> or <strong>Library</strong> to start.</p>
                </div>
            ) : (
                <ul className={styles.topicList}>
                    {topics.map((topic, tIdx) => (
                        <li key={tIdx} className={styles.topicItem}>
                            <div className={styles.topicRow}>
                                {/* Topic Reordering Controls */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <button
                                        type="button"
                                        className={styles.reorderBtn}
                                        onClick={() => onMoveTopicUp && onMoveTopicUp(tIdx)}
                                        disabled={tIdx === 0}
                                        title="Move Topic Up"
                                    >
                                        <ChevronUp size={12} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.reorderBtn}
                                        onClick={() => onMoveTopicDown && onMoveTopicDown(tIdx)}
                                        disabled={tIdx === topics.length - 1}
                                        title="Move Topic Down"
                                    >
                                        <ChevronDown size={12} />
                                    </button>
                                </div>

                                <i className="fa-solid fa-dove" style={{ marginRight: '4px', fontSize: '0.85rem', color: 'var(--tech-blue)' }} aria-hidden="true" />
                                <input
                                    type="text"
                                    className={styles.topicTitleInput}
                                    value={topic.title}
                                    onChange={e => onUpdateTopicTitle(tIdx, e.target.value)}
                                    title="Edit topic title"
                                    placeholder="Topic title"
                                />
                                <button
                                    type="button"
                                    className={styles.iconBtnDanger}
                                    onClick={() => onRemoveTopic(tIdx)}
                                    title="Remove topic"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <div className={styles.topicDescRow}>
                                <input
                                    type="text"
                                    className={styles.topicDescInput}
                                    value={topic.description}
                                    onChange={e => onUpdateTopicDescription(tIdx, e.target.value)}
                                    placeholder="Short topic description…"
                                />
                            </div>

                            <ul className={styles.subtopicList}>
                                {topic.subtopics?.map((sub, sIdx) => {
                                    const isActive = activeTopicIndex === tIdx && activeSubtopicIndex === sIdx;
                                    const displayTitle = cleanSubtopicTitle(sub.title);
                                    return (
                                        <li
                                            key={sIdx}
                                            className={`${styles.subtopicItem} ${isActive ? styles.subtopicItemActive : ''}`}
                                            onClick={() => onSelectSubtopic(tIdx, sIdx)}
                                        >
                                            <span className={styles.subtopicIndex}>{sIdx + 1}.</span>
                                            <span className={styles.subtopicLabel}>{displayTitle}</span>
                                            <button
                                                type="button"
                                                className={styles.iconBtnDanger}
                                                onClick={e => { e.stopPropagation(); onRemoveSubtopic(tIdx, sIdx); }}
                                                title="Remove subtopic"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </li>
                                    );
                                })}
                                <li>
                                    <button
                                        type="button"
                                        className={styles.addSubtopicBtn}
                                        onClick={() => onAddSubtopic(tIdx)}
                                    >
                                        <Plus size={12} /> Add subtopic
                                    </button>
                                </li>
                            </ul>
                        </li>
                    ))}
                </ul>
            )}

            {/* Create Topic Modal (Form vs Raw JSON import) */}
            <CreateTopicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateTopic={(newTopic) => onAddTopic(newTopic)}
                onImportTopicJson={(jsonInput) => onImportTopicJson ? onImportTopicJson(jsonInput) : false}
            />

            {/* Attach Existing Topic Library Modal */}
            {onAttachExistingTopic && (
                <AttachTopicModal
                    isOpen={isAttachModalOpen}
                    onClose={() => setIsAttachModalOpen(false)}
                    existingTopicIds={existingTopicIds}
                    onAttachTopic={onAttachExistingTopic}
                />
            )}
        </section>
    );
};
