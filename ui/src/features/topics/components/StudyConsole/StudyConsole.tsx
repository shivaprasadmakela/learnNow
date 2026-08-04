import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, BookOpen, Clock, CheckCircle2, FileText, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TopicDetails, SubtopicData } from '../../../../shared/api/profile.api';
import { ContentRenderer } from '../../../../shared/components/content-renderer/ContentRenderer';
import { CodePlayground } from '../../../../shared/components/code-playground';
import { useSubtopicNote, useBookmarks, BookmarkButton, SubtopicNotesPanel } from '../../../notes';
import styles from './StudyConsole.module.css';

interface StudyConsoleProps {
    topic: TopicDetails;
    onClose: () => void;
    onToggleComplete: () => Promise<void>;
    onToggleSubtopicComplete?: (subtopicId: string | number, completed: boolean) => Promise<void>;
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
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isActiveSubtopicQuizzesAnswered, setIsActiveSubtopicQuizzesAnswered] = useState<boolean>(true);
    const [activePlaygrounds, setActivePlaygrounds] = useState<Record<string, boolean>>({});

    const subtopics = topic.subtopics || [];
    const activeSubtopic: SubtopicData | undefined = subtopics[activeSubtopicIndex];

    const { isBookmarked, toggleBookmark } = useBookmarks();
    const { content: noteContent, setContent: setNoteContent, saveStatus: noteSaveStatus, isLoading: isNoteLoading, saveNow } = useSubtopicNote(activeSubtopic?.id);

    const completedSubtopicsCount = subtopics.filter((s: SubtopicData) => s.isCompleted).length;
    const allSubtopicsCompleted = subtopics.length > 0 && subtopics.every((s: SubtopicData) => s.isCompleted);
    const isTopicCompleteDisabled = isUpdating || topic.isCompleted || !allSubtopicsCompleted;

    const computedPercentage = topic.isCompleted ? 100 : (
        subtopics.length > 0 ? Math.round((completedSubtopicsCount / subtopics.length) * 100) : (topic.progressPercentage || 0)
    );

    const handleSubtopicChange = (index: number) => {
        if (index >= 0 && index < subtopics.length) {
            setActiveSubtopicIndex(index);
            setIsTocOpen(false);
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

    const handleSubtopicReadToggle = async (subtopicId: string | number, currentlyCompleted: boolean) => {
        if (currentlyCompleted) return;
        if (onToggleSubtopicComplete) {
            await onToggleSubtopicComplete(subtopicId, true);
        }
    };

    const handleTopicCompleteToggle = async () => {
        if (topic.isCompleted) return;
        await onToggleComplete();
    };

    const togglePlayground = (snippetKey: string) => {
        setActivePlaygrounds(prev => ({ ...prev, [snippetKey]: !prev[snippetKey] }));
    };

    /** Map common markdown fence aliases to canonical Monaco / executor language IDs */
    const normalizeLanguage = (alias: string): string => {
        const map: Record<string, string> = {
            js: 'javascript',
            ts: 'typescript',
            py: 'python',
            rb: 'ruby',
            sh: 'shell',
            bash: 'shell',
            cs: 'csharp',
            'c++': 'cpp',
            kt: 'kotlin',
            rs: 'rust',
        };
        return map[alias.toLowerCase()] ?? alias.toLowerCase();
    };

    const renderContent = (content: string) => {
        if (!content) return null;

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }: { children?: React.ReactNode }) => <h2 className={styles.heading2}>{children}</h2>,
                    h2: ({ children }: { children?: React.ReactNode }) => <h2 className={styles.heading2}>{children}</h2>,
                    h3: ({ children }: { children?: React.ReactNode }) => <h3 className={styles.heading3}>{children}</h3>,
                    h4: ({ children }: { children?: React.ReactNode }) => <h4 className={styles.heading4}>{children}</h4>,
                    p: ({ children }: { children?: React.ReactNode }) => <p className={styles.paragraph}>{children}</p>,
                    ul: ({ children }: { children?: React.ReactNode }) => <ul className={styles.list}>{children}</ul>,
                    ol: ({ children }: { children?: React.ReactNode }) => <ol className={styles.list}>{children}</ol>,
                    table: ({ children }: { children?: React.ReactNode }) => (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>{children}</table>
                        </div>
                    ),
                    blockquote: ({ children }: { children?: React.ReactNode }) => (
                        <blockquote
                            style={{
                                borderLeft: '4px solid var(--tech-blue)',
                                paddingLeft: '1rem',
                                margin: '1.25rem 0',
                                color: 'var(--text-secondary)',
                                fontStyle: 'italic',
                                background: 'var(--bg-primary)',
                                padding: '0.75rem 1rem',
                                borderRadius: '0 8px 8px 0'
                            }}
                        >
                            {children}
                        </blockquote>
                    ),
                    code(props: React.ComponentPropsWithoutRef<'code'> & { node?: unknown }) {
                        const { className, children, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        const isInline = !className;
                        const codeString = String(children || '').replace(/\n$/, '');
                        const snippetKey = `${lang}-${codeString.slice(0, 20)}`;
                        const isOpen = Boolean(activePlaygrounds[snippetKey]);

                        if (isInline) {
                            return <code className="inline-code" {...rest}>{children}</code>;
                        }

                        return (
                            <div style={{ margin: '20px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                                        Code Snippet ({lang || 'text'})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => togglePlayground(snippetKey)}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--tech-blue)',
                                            background: isOpen ? 'var(--tech-blue)' : 'transparent',
                                            color: isOpen ? '#ffffff' : 'var(--tech-blue)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {isOpen ? 'Hide Playground' : '⚡ Try in Playground'}
                                    </button>
                                </div>

                                {isOpen ? (
                                    <CodePlayground initialCode={codeString} language={normalizeLanguage(lang || 'javascript')} />
                                ) : (
                                    <pre className={styles.codeBlock}>
                                        {lang && <span className={styles.codeLang}>{lang}</span>}
                                        <code>{codeString}</code>
                                    </pre>
                                )}
                            </div>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        );
    };

    return (
        <div className={styles.studyOverlay}>
            {/* Header section */}
            <header className={styles.studyHeader}>
                <div className={styles.headerLeft}>
                    <button 
                        type="button"
                        className={styles.mobileTocToggle}
                        onClick={() => setIsTocOpen(!isTocOpen)}
                        title="Toggle Table of Contents"
                    >
                        <List size={16} />
                        <span>Menu</span>
                    </button>
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
                {/* Mobile TOC Drawer Overlay */}
                {isTocOpen && (
                    <div className={styles.tocDrawerOverlay} onClick={() => setIsTocOpen(false)} />
                )}

                {/* Left Sidebar Table of Contents */}
                <aside className={`${styles.tocSidebar} ${isTocOpen ? styles.tocSidebarOpen : ''}`}>
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
                                                isSubtopicCompleted={Boolean(activeSubtopic.isCompleted)}
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
                                                onAllQuizzesAnsweredChange={setIsActiveSubtopicQuizzesAnswered}
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
                                        disabled={isUpdating || Boolean(activeSubtopic.isCompleted) || !isActiveSubtopicQuizzesAnswered}
                                        title={
                                            activeSubtopic.isCompleted
                                                ? 'Section already completed'
                                                : !isActiveSubtopicQuizzesAnswered
                                                    ? 'Answer all MCQs in this section first'
                                                    : 'Mark section as read (+5 pts)'
                                        }
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
                                            cursor: (activeSubtopic.isCompleted || !isActiveSubtopicQuizzesAnswered) ? 'not-allowed' : 'pointer',
                                            opacity: (!activeSubtopic.isCompleted && !isActiveSubtopicQuizzesAnswered) ? 0.6 : 1,
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
                    onClick={handleTopicCompleteToggle}
                    disabled={isTopicCompleteDisabled}
                    title={
                        topic.isCompleted
                            ? 'Topic completed'
                            : !allSubtopicsCompleted
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
