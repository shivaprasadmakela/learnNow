import React from 'react';
import { Plus, Trash2, BookOpen, Layers } from 'lucide-react';
import styles from './CurriculumPanel.module.css';
import type { AdminTopicData } from '../../../api/admin.api';

interface CurriculumPanelProps {
    topics: AdminTopicData[];
    activeTopicIndex: number;
    activeSubtopicIndex: number;
    onSelectSubtopic: (topicIdx: number, subtopicIdx: number) => void;
    onAddTopic: () => void;
    onRemoveTopic: (topicIdx: number) => void;
    onUpdateTopicTitle: (topicIdx: number, value: string) => void;
    onUpdateTopicDescription: (topicIdx: number, value: string) => void;
    onAddSubtopic: (topicIdx: number) => void;
    onRemoveSubtopic: (topicIdx: number, subtopicIdx: number) => void;
}

export const CurriculumPanel: React.FC<CurriculumPanelProps> = ({
    topics,
    activeTopicIndex,
    activeSubtopicIndex,
    onSelectSubtopic,
    onAddTopic,
    onRemoveTopic,
    onUpdateTopicTitle,
    onUpdateTopicDescription,
    onAddSubtopic,
    onRemoveSubtopic,
}) => (
    <section className={styles.panel}>
        <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Curriculum</h3>
            <button type="button" className={styles.addTopicBtn} onClick={onAddTopic}>
                <Plus size={14} /> Topic
            </button>
        </div>

        {topics.length === 0 ? (
            <div className={styles.emptyState}>
                <Layers size={32} className={styles.emptyIcon} />
                <p>No topics yet. Click <strong>+ Topic</strong> to start.</p>
            </div>
        ) : (
            <ul className={styles.topicList}>
                {topics.map((topic, tIdx) => (
                    <li key={tIdx} className={styles.topicItem}>
                        <div className={styles.topicRow}>
                            <BookOpen size={14} className={styles.topicIcon} />
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
                                return (
                                    <li
                                        key={sIdx}
                                        className={`${styles.subtopicItem} ${isActive ? styles.subtopicItemActive : ''}`}
                                        onClick={() => onSelectSubtopic(tIdx, sIdx)}
                                    >
                                        <span className={styles.subtopicLabel}>{sub.title || `Subtopic ${sIdx + 1}`}</span>
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
    </section>
);
