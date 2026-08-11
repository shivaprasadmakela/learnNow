import React, { useState } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import styles from './CoursePreviewModal.module.css';
import type { AdminTopicData, QuizQuestionDto } from '../../api/admin.api';
import { ContentRenderer, type ContentBlockItem } from '../../../../shared/components/content-renderer/ContentRenderer';

interface CoursePreviewModalProps {
    title: string;
    managedBy: string;
    topics: AdminTopicData[];
}

interface SubtopicEntry {
    topicIdx: number;
    topicTitle: string;
    subtopicIdx: number;
    subtopicTitle: string;
    content: string;
    questions?: QuizQuestionDto[];
}

function flattenSubtopics(topics: AdminTopicData[]): SubtopicEntry[] {
    const entries: SubtopicEntry[] = [];
    topics.forEach((topic, tIdx) => {
        (topic.subtopics || []).forEach((sub, sIdx) => {
            entries.push({
                topicIdx: tIdx,
                topicTitle: topic.title,
                subtopicIdx: sIdx,
                subtopicTitle: sub.title,
                content: sub.content,
                questions: sub.questions,
            });
        });
    });
    return entries;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({ title, managedBy: _managedBy, topics }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const entries = flattenSubtopics(topics);
    const active = entries[activeIndex];

    const activeBlocks: ContentBlockItem[] = active ? [
        ...(active.content ? [{
            id: `preview-md-${active.topicIdx}-${active.subtopicIdx}`,
            orderIndex: 1,
            type: 'markdown' as const,
            body: active.content,
        }] : []),
        ...(active.questions && active.questions.length > 0 ? [{
            id: `preview-quiz-${active.topicIdx}-${active.subtopicIdx}`,
            orderIndex: 2,
            type: 'quiz' as const,
            questions: active.questions.map((q, idx) => ({
                id: q.id || `q-${idx}`,
                kind: q.kind as any,
                prompt: q.prompt,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                points: q.points,
            })),
        }] : [])
    ] : [];

    return (
        <>
            <button type="button" className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
                <Eye size={15} /> Preview
            </button>

            {isOpen && (
                <div
                    className={styles.overlay}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Course Preview"
                    onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
                >
                    <div className={styles.modal}>

                        {/* ── Header ───────────────────────────────────── */}
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <Eye size={16} className={styles.titleIcon} />
                                <span>{title || 'Untitled Course'}</span>
                            </div>
                            <button type="button" className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── Body ─────────────────────────────────────── */}
                        {entries.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Add topics with subtopics to preview the course.</p>
                            </div>
                        ) : (
                            <div className={styles.consoleView}>

                                {/* TOC Sidebar */}
                                <aside className={styles.toc}>
                                    <p className={styles.tocLabel}>Table of Contents</p>
                                    {topics.map((topic, tIdx) => (
                                        <div key={tIdx} className={styles.tocGroup}>
                                            <p className={styles.tocGroupTitle}>{topic.title}</p>
                                            <ul className={styles.tocList}>
                                                {(topic.subtopics || []).map((sub, sIdx) => {
                                                    const flatIdx = entries.findIndex(
                                                        e => e.topicIdx === tIdx && e.subtopicIdx === sIdx
                                                    );
                                                    return (
                                                        <li key={sIdx}>
                                                            <button
                                                                type="button"
                                                                className={`${styles.tocItem} ${flatIdx === activeIndex ? styles.tocItemActive : ''}`}
                                                                onClick={() => setActiveIndex(flatIdx)}
                                                            >
                                                                {flatIdx === activeIndex
                                                                    ? <CheckCircle2 size={13} className={styles.tocCheck} />
                                                                    : <span className={styles.tocNum}>{sIdx + 1}</span>
                                                                }
                                                                <span>{sub.title}</span>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ))}
                                </aside>

                                {/* Reading Pane — only active subtopic */}
                                <main className={styles.readingPane}>
                                    {active ? (
                                        <article className={styles.article}>
                                            <h1 className={styles.articleTitle}>{active.subtopicTitle}</h1>
                                            <div className={styles.articleBody}>
                                                <ContentRenderer blocks={activeBlocks} />
                                            </div>
                                        </article>
                                    ) : (
                                        <div className={styles.emptyState}>
                                            <p>Select a section from the sidebar.</p>
                                        </div>
                                    )}
                                </main>
                            </div>
                        )}

                        {/* ── Footer Nav ───────────────────────────────── */}
                        {entries.length > 0 && (
                            <div className={styles.consoleFooter}>
                                <button
                                    type="button"
                                    className={styles.navBtn}
                                    onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                                    disabled={activeIndex === 0}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <span className={styles.navProgress}>
                                    {activeIndex + 1} / {entries.length} sections
                                </span>
                                <button
                                    type="button"
                                    className={styles.navBtn}
                                    onClick={() => setActiveIndex(i => Math.min(entries.length - 1, i + 1))}
                                    disabled={activeIndex === entries.length - 1}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
