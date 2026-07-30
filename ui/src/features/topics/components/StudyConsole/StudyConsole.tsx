import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, BookOpen, Clock, CheckCircle2, FileText } from 'lucide-react';
import type { TopicDetails, SubtopicData } from '../../../../shared/api/profile.api';
import { ContentRenderer } from '../../../../shared/components/content-renderer/ContentRenderer';
import { useSubtopicNote, useBookmarks, BookmarkButton, SubtopicNotesPanel } from '../../../notes';
import styles from './StudyConsole.module.css';

interface StudyConsoleProps {
    topic: TopicDetails;
    onClose: () => void;
    onToggleComplete: () => Promise<void>;
    onToggleSubtopicComplete?: (subtopicId: string, completed: boolean) => Promise<void>;
    isUpdating: boolean;
}

export function StudyConsole({ 
    topic, 
    onClose, 
    onToggleComplete, 
    onToggleSubtopicComplete,
    isUpdating
}: StudyConsoleProps) {
    const [activeSubtopicIndex, setActiveSubtopicIndex] = useState(0);
    const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);

    const subtopics = topic.subtopics || [];
    const activeSubtopic: SubtopicData | undefined = subtopics[activeSubtopicIndex];

    const { isBookmarked, toggleBookmark } = useBookmarks();
    const { content: noteContent, setContent: setNoteContent, saveStatus: noteSaveStatus, isLoading: isNoteLoading, saveNow } = useSubtopicNote(activeSubtopic?.id);

    const completedSubtopicsCount = subtopics.filter((s: SubtopicData) => s.isCompleted).length;
    const allSubtopicsCompleted = subtopics.length > 0 && subtopics.every((s: SubtopicData) => s.isCompleted);
    const isCompleteDisabled = isUpdating || (!topic.isCompleted && !allSubtopicsCompleted);

    const computedPercentage = topic.isCompleted ? 100 : (
        subtopics.length > 0 ? Math.round((completedSubtopicsCount / subtopics.length) * 100) : (topic.progressPercentage || 0)
    );

    const handleSubtopicChange = (index: number) => {
        if (index >= 0 && index < subtopics.length) {
            setActiveSubtopicIndex(index);
        }
    };

    const handleNext = () => {
        if (activeSubtopicIndex < subtopics.length - 1) {
            handleSubtopicChange(activeSubtopicIndex + 1);
        }
    };

    const handlePrev = () => {
        if (activeSubtopicIndex > 0) {
            handleSubtopicChange(activeSubtopicIndex - 1);
        }
    };

    const handleSubtopicReadToggle = async (subtopicId: any, currentlyCompleted: boolean) => {
        if (onToggleSubtopicComplete) {
            await onToggleSubtopicComplete(subtopicId, !currentlyCompleted);
        }
    };

    // Custom markdown formatter for structured articles
    const renderContent = (content: string) => {
        if (!content) return null;
        const parts = content.split(/```/);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                // Code block formatting
                const lines = part.split('\n');
                const lang = lines[0].trim();
                const code = lines.slice(1).join('\n').trim();
                return (
                    <pre key={index} className={styles.codeBlock}>
                        {lang && <span className={styles.codeLang}>{lang}</span>}
                        <code>{code}</code>
                    </pre>
                );
            } else {
                // Formatting simple markdown annotations
                return (
                    <div key={index} className={styles.textBlock}>
                        {part.split('\n\n').map((paragraph, pIdx) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;

                            // Title Headings
                            if (trimmed.startsWith('## ')) {
                                return <h3 key={pIdx} className={styles.heading3}>{trimmed.replace(/^## /, '')}</h3>;
                            }
                            if (trimmed.startsWith('### ')) {
                                return <h4 key={pIdx} className={styles.heading4}>{trimmed.replace(/^### /, '')}</h4>;
                            }
                            if (trimmed.startsWith('# ')) {
                                return <h2 key={pIdx} className={styles.heading2}>{trimmed.replace(/^# /, '')}</h2>;
                            }

                            // Bullet Lists
                            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                                const listItems = trimmed.split(/\n[\*\-]\s+/);
                                return (
                                    <ul key={pIdx} className={styles.list}>
                                        {listItems.map((item, iIdx) => {
                                            const cleanItem = item.replace(/^[\*\-]\s+/, '').trim();
                                            const formatted = cleanItem
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
                                            return <li key={iIdx} dangerouslySetInnerHTML={{ __html: formatted }} />;
                                        })}
                                    </ul>
                                );
                            }

                            // Table block replacement (Comparison tables)
                            if (trimmed.startsWith('|')) {
                                const tableRows = trimmed.split('\n').filter(r => r.trim());
                                const headers = tableRows[0].split('|').map(h => h.trim()).filter(h => h);
                                const rows = tableRows.slice(2).map(r => r.split('|').map(td => td.trim()).filter(td => td));
                                return (
                                    <div key={pIdx} className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row, rIdx) => (
                                                    <tr key={rIdx}>
                                                        {row.map((val, cIdx) => {
                                                            const formatted = val
                                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                                .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
                                                            return <td key={cIdx} dangerouslySetInnerHTML={{ __html: formatted }} />;
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            }

                            // Regular text formatting (inline bold, italic, code tags)
                            const formatted = trimmed
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');

                            return <p key={pIdx} className={styles.paragraph} dangerouslySetInnerHTML={{ __html: formatted }} />;
                        })}
                    </div>
                );
            }
        });
    };

    return (
        <div className={styles.studyOverlay}>
            {/* Header section */}
            <header className={styles.studyHeader}>
                <div className={styles.headerLeft}>
                    <BookOpen className={styles.headerIcon} />
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 className={styles.subtopicTitle}>{topic.title}</h2>
                            <BookmarkButton
                                isBookmarked={isBookmarked(topic.id)}
                                onToggle={() => toggleBookmark(topic.id)}
                                showLabel={false}
                            />
                        </div>
                        <div className={styles.metaRow}>
                            <span className={styles.categoryBadge}>{topic.category}</span>
                            <span className={styles.durationRow}>
                                <Clock size={13} />
                                {topic.duration}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.headerCenter}>
                    <span className={styles.progressText}>
                        Topic Progress: {computedPercentage}% ({completedSubtopicsCount}/{subtopics.length} sections)
                    </span>
                    <div className={styles.progressBarBg}>
                        <div 
                            className={styles.progressBarFill} 
                            style={{ width: `${computedPercentage}%` }}
                        />
                    </div>
                </div>

                <button className={styles.closeBtn} onClick={onClose} aria-label="Exit Study Console">
                    <X size={20} />
                </button>
            </header>

            {/* Split layout */}
            <div className={styles.studyBody}>
                {/* Left Sidebar Table of Contents */}
                <aside className={styles.tocSidebar}>
                    <h3 className={styles.sidebarTitle}>Table of Contents</h3>
                    <ul className={styles.tocList}>
                        {subtopics.map((sec: SubtopicData, idx: number) => (
                            <li key={sec.id}>
                                <button
                                    className={`${styles.tocItem} ${idx === activeSubtopicIndex ? styles.tocItemActive : ''}`}
                                    onClick={() => handleSubtopicChange(idx)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {sec.isCompleted ? (
                                            <CheckCircle2 size={14} style={{ color: 'var(--tech-green)' }} />
                                        ) : (
                                            <span className={styles.tocIndex}>{idx + 1}</span>
                                        )}
                                        <span className={styles.tocName}>{sec.title}</span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main reading content pane */}
                <main className={styles.contentPane}>
                    {activeSubtopic ? (
                        <div className={isNotesDrawerOpen ? styles.contentFlexLayout : ''}>
                            <article className={styles.article}>
                                <div className={styles.subtopicHeaderRow}>
                                    <h1 className={styles.sectionTitle}>{activeSubtopic.title}</h1>
                                    <button
                                        type="button"
                                        className={`${styles.subtopicNotesBtn} ${isNotesDrawerOpen ? styles.subtopicNotesBtnActive : ''}`}
                                        onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}
                                        title="Toggle Subtopic Notes"
                                    >
                                        <FileText size={15} />
                                        <span>Notes</span>
                                        {Boolean(noteContent.trim()) && <span className={styles.subtopicNoteDot} />}
                                    </button>
                                </div>

                                <div className={styles.articleBody}>
                                    {renderContent(activeSubtopic.content)}
                                    {activeSubtopic.questions && activeSubtopic.questions.length > 0 && (
                                        <div style={{ marginTop: '32px' }}>
                                            <ContentRenderer
                                                blocks={[{
                                                    id: `quiz-${activeSubtopic.id || activeSubtopicIndex}`,
                                                    orderIndex: 1,
                                                    type: 'quiz',
                                                    questions: activeSubtopic.questions.map((q, qIdx) => ({
                                                        id: q.id || `q-${qIdx}`,
                                                        kind: q.kind || 'mcq',
                                                        prompt: q.prompt,
                                                        options: q.options,
                                                        correctAnswer: q.correctAnswer,
                                                        explanation: q.explanation,
                                                        points: q.points,
                                                    })),
                                                }]}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Subtopic Explicit Mark as Completed Action */}
                                <div style={{
                                    marginTop: '32px',
                                    paddingTop: '20px',
                                    borderTop: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSubtopicReadToggle(activeSubtopic.id, !!activeSubtopic.isCompleted)}
                                        disabled={isUpdating}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            border: activeSubtopic.isCompleted ? '1px solid var(--tech-green)' : '1px solid var(--tech-blue)',
                                            backgroundColor: activeSubtopic.isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'var(--tech-blue)',
                                            color: activeSubtopic.isCompleted ? 'var(--tech-green)' : '#ffffff',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <CheckCircle2 size={16} />
                                        {activeSubtopic.isCompleted ? 'Completed (+5 pts)' : 'Mark section as read (+5 pts)'}
                                    </button>
                                </div>
                            </article>

                            {/* In-pane corner slider Subtopic Notes Panel */}
                            <SubtopicNotesPanel
                                isOpen={isNotesDrawerOpen}
                                content={noteContent}
                                onChange={setNoteContent}
                                onSave={saveNow}
                                onClose={() => setIsNotesDrawerOpen(false)}
                                saveStatus={noteSaveStatus}
                                isLoading={isNoteLoading}
                            />
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>No content sections loaded for this topic.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Sticky study footer */}
            <footer className={styles.studyFooter}>
                <button 
                    className={styles.navBtn} 
                    onClick={handlePrev} 
                    disabled={activeSubtopicIndex === 0}
                >
                    <ChevronLeft size={18} />
                    Previous
                </button>

                <button
                    className={`${styles.completeBtn} ${topic.isCompleted ? styles.completeBtnActive : ''}`}
                    onClick={onToggleComplete}
                    disabled={isCompleteDisabled}
                    title={
                        !topic.isCompleted && !allSubtopicsCompleted
                            ? `Complete all ${subtopics.length} sections to enable topic completion (${completedSubtopicsCount}/${subtopics.length} done)`
                            : undefined
                    }
                >
                    {topic.isCompleted ? (
                        <>
                            <Check size={16} />
                            Topic Completed!
                        </>
                    ) : (
                        `Mark Entire Topic as Completed (${completedSubtopicsCount}/${subtopics.length})`
                    )}
                </button>

                <button 
                    className={styles.navBtn} 
                    onClick={handleNext} 
                    disabled={subtopics.length === 0 || activeSubtopicIndex === subtopics.length - 1}
                >
                    Next
                    <ChevronRight size={18} />
                </button>
            </footer>
        </div>
    );
}
