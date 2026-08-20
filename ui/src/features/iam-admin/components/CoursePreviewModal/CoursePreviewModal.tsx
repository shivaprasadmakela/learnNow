import React, { useState } from 'react';
import { Eye, X } from 'lucide-react';
import styles from './CoursePreviewModal.module.css';
import type { AdminTopicData } from '../../api/admin.api';
import type { TopicDetails } from '../../../../shared/api/profile.api';
import { StudyConsole } from '../../../topics/components/StudyConsole/StudyConsole';

interface CoursePreviewModalProps {
    title: string;
    managedBy: string;
    topics: AdminTopicData[];
}

const adaptAdminTopicToDetails = (topic: AdminTopicData, topicIdx: number): TopicDetails => {
    return {
        id: topic.id || `preview-topic-${topicIdx}`,
        title: topic.title || 'Untitled Topic',
        description: topic.description || 'Topic overview and learning goals.',
        category: topic.category || 'Backend',
        duration: topic.duration || '30 mins',
        isCompleted: false,
        progressPercentage: 0,
        subtopics: (topic.subtopics || []).map((sub, sIdx) => ({
            id: sub.id || `preview-sub-${topicIdx}-${sIdx}`,
            title: sub.title || `Section ${sIdx + 1}`,
            content: sub.content || '',
            orderIndex: sub.orderIndex || sIdx + 1,
            isCompleted: false,
            questions: sub.questions ? sub.questions.map((q, qIdx) => ({
                id: q.id || `q-${sIdx}-${qIdx}`,
                kind: q.kind,
                prompt: q.prompt,
                question: q.prompt,
                options: q.options || [],
                correctAnswer: q.correctAnswer || '',
                answer: q.correctAnswer || '',
                explanation: q.explanation,
                points: q.points || 10,
            })) : [],
        })),
    };
};

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({ topics }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTopicIdx, setActiveTopicIdx] = useState(0);

    if (!isOpen) {
        return (
            <button type="button" className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
                <Eye size={15} /> Preview
            </button>
        );
    }

    if (!topics || topics.length === 0) {
        return (
            <>
                <button type="button" className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
                    <Eye size={15} /> Preview
                </button>
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.previewModalWrapper} style={{ height: 'auto', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.previewHeaderBar}>
                            <span className={styles.previewBadge}>
                                <Eye size={14} /> Course Preview
                            </span>
                            <button type="button" className={styles.modalCloseBtn} onClick={() => setIsOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.emptyState}>
                            <p>No topics available to preview. Add at least one topic with subtopics in the Curriculum panel.</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const currentTopicData = topics[activeTopicIdx] || topics[0];
    const previewTopic = adaptAdminTopicToDetails(currentTopicData, activeTopicIdx);
    const nextTopic = topics[activeTopicIdx + 1];

    return (
        <>
            <button type="button" className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
                <Eye size={15} /> Preview
            </button>

            {/* Windowed Modal Overlay Container */}
            <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                <div className={styles.previewModalWrapper} onClick={e => e.stopPropagation()}>
                    {/* Top Preview Header Bar */}
                    <div className={styles.previewHeaderBar}>
                        <div className={styles.previewBadge}>
                            <Eye size={14} />
                            <span>Admin Live Preview Mode</span>
                        </div>

                        {topics.length > 1 && (
                            <div className={styles.topicSelectGroup}>
                                <label>Select Topic:</label>
                                <select
                                    value={activeTopicIdx}
                                    onChange={e => setActiveTopicIdx(Number(e.target.value))}
                                    className={styles.topicSelect}
                                >
                                    {topics.map((t, idx) => (
                                        <option key={idx} value={idx}>
                                            {idx + 1}. {t.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            type="button"
                            className={styles.modalCloseBtn}
                            onClick={() => setIsOpen(false)}
                            title="Close Preview"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scoped StudyConsole Console View */}
                    <div className={styles.consoleContainer}>
                        <StudyConsole
                            topic={previewTopic}
                            onClose={() => setIsOpen(false)}
                            onToggleComplete={async () => {}}
                            onToggleSubtopicComplete={async () => {}}
                            onSelectNextTopic={nextTopic ? () => setActiveTopicIdx(prev => prev + 1) : undefined}
                            nextTopicTitle={nextTopic?.title}
                            isUpdating={false}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};
