import React, { useState, useRef, useEffect } from 'react';

import { X, ChevronLeft, ChevronRight, Check, BookOpen, Clock, CheckCircle2, FileText, List, Copy, Code as CodeIcon, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TopicDetails, SubtopicData } from '../../../../shared/api/profile.api';
import { ContentRenderer } from '../../../../shared/components/content-renderer/ContentRenderer';
import { MermaidDiagram } from '../../../../shared/components/mermaid';
import { isExecutableLanguage, formatExecutableCode } from '../../../../shared/utils/codeWrapper';
import { RunnableCodeBlock } from '../../../../shared/components/ui/RunnableCodeBlock';
import { YouTubeEmbed } from '../../../../shared/components/ui/YouTubeEmbed';
import { LevelBadge, TrackBadge, DurationBadge } from '../../../../shared/components/ui/Badge';
import { useSubtopicNote, useBookmarks, BookmarkButton, SubtopicNotesPanel } from '../../../notes';
import { PlaygroundSidePanel } from '../PlaygroundSidePanel';
import styles from './StudyConsole.module.css';

interface StudyConsoleProps {
    topic: TopicDetails;
    onClose: () => void;
    onToggleComplete: () => Promise<void>;
    onToggleSubtopicComplete?: (subtopicId: string | number, completed: boolean) => Promise<void>;
    onSelectNextTopic?: () => void;
    onOpenFullCompiler?: (code: string, language: string) => void;
    isUpdating: boolean;
}

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

const StudyCodeBlock: React.FC<{
    codeString: string;
    preparedCode: string;
    lang: string;
    executable: boolean;
    onOpenPlayground: (code: string, language: string) => void;
}> = ({ codeString, preparedCode, lang, executable, onOpenPlayground }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.codeBlockWrapper}>
            <div className={styles.codeBlockHeader}>
                <span className={styles.codeBlockLangBadge}>
                    <CodeIcon size={13} style={{ marginRight: '6px' }} />
                    {lang ? lang.toUpperCase() : 'CODE'}
                </span>
                <div className={styles.codeBlockActions}>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={handleCopy}
                        title="Copy code"
                    >
                        {copied ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    {executable && (
                        <button
                            type="button"
                            className={styles.playgroundActionBtn}
                            onClick={() => onOpenPlayground(preparedCode, lang)}
                            title="Try in Playground Side Panel"
                        >
                            <Terminal size={13} />
                            <span>⚡ Try in Playground</span>
                        </button>
                    )}
                </div>
            </div>

            <pre className={styles.codePreBlock}>
                <code>{codeString}</code>
            </pre>
        </div>
    );
};

export function StudyConsole({ 
    topic, 
    onClose, 
    onToggleComplete, 
    onToggleSubtopicComplete,
    onSelectNextTopic,
    onOpenFullCompiler,
    isUpdating
}: StudyConsoleProps) {
    const subtopics = topic.subtopics || [];

    // Inspect URL on mount to restore active subtopic index if URL contains subtopic slug
    const [activeSubtopicIndex, setActiveSubtopicIndex] = useState<number>(() => {
        if (typeof window !== 'undefined' && subtopics.length > 0) {
            const parts = window.location.pathname.split('/').filter(Boolean);
            if (parts.length >= 4 && parts[0] === 'paths') {
                const subtopicSlug = parts[3];
                const matchIdx = subtopics.findIndex(s => {
                    const sSlug = slugify(s.title);
                    const sClean = s.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const rClean = subtopicSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return sSlug === subtopicSlug || String(s.id) === subtopicSlug || sClean === rClean || rClean.includes(sClean) || sClean.includes(rClean);
                });
                if (matchIdx >= 0) return matchIdx;
            }
        }
        return 0;
    });

    const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [playgroundDrawer, setPlaygroundDrawer] = useState<{
        isOpen: boolean;
        code: string;
        language: string;
    }>({
        isOpen: false,
        code: '',
        language: 'java'
    });

    const handleOpenPlaygroundDrawer = (code: string, language: string) => {
        setIsNotesDrawerOpen(false);
        setPlaygroundDrawer({
            isOpen: true,
            code,
            language: language || 'java'
        });
    };

    const contentPaneRef = useRef<HTMLElement>(null);

    const activeSubtopic: SubtopicData | undefined = subtopics[activeSubtopicIndex];

    const hasUnansweredQuizzes = Boolean(
        activeSubtopic &&
        !activeSubtopic.isCompleted &&
        activeSubtopic.questions &&
        activeSubtopic.questions.length > 0
    );

    const [isActiveSubtopicQuizzesAnswered, setIsActiveSubtopicQuizzesAnswered] = useState<boolean>(!hasUnansweredQuizzes);

    // Sync browser URL to /paths/:pathSlug/:topicSlug/:subtopicSlug on subtopic change
    useEffect(() => {
        if (typeof window === 'undefined' || !activeSubtopic) return;
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0] === 'paths') {
            const pathSlug = parts[1] || 'course';
            const topicSlug = parts[2] || slugify(topic.title);
            const subtopicSlug = slugify(activeSubtopic.title);
            const targetUrl = `/paths/${pathSlug}/${topicSlug}/${subtopicSlug}`;

            if (window.location.pathname !== targetUrl) {
                window.history.replaceState(null, '', targetUrl);
            }
        }
    }, [activeSubtopicIndex, activeSubtopic, topic.title]);

    // Scroll back to top whenever the active subtopic changes
    useEffect(() => {
        contentPaneRef.current?.scrollTo({ top: 0, behavior: 'instant' });
        setIsActiveSubtopicQuizzesAnswered(!hasUnansweredQuizzes);
    }, [activeSubtopicIndex, hasUnansweredQuizzes]);

    const { isBookmarked, toggleBookmark } = useBookmarks();
    const { content: noteContent, setContent: setNoteContent, saveStatus: noteSaveStatus, isLoading: isNoteLoading, saveNow } = useSubtopicNote(activeSubtopic?.id, isNotesDrawerOpen);

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

    const renderContent = (content: string) => {
        if (!content) return null;

        const snippetMap = new Map((activeSubtopic?.codeSnippets || []).map(s => [s.id, s]));

        const processedContent = content.replace(/\{\{snippet:([^}]+)\}\}/g, (_, id) => {
            const cleanId = id.trim();
            return `\n\n\`\`\`__snippet__:${cleanId}\n\`\`\`\n\n`;
        });

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
                    img: ({ src, alt }: { src?: string; alt?: string }) => (
                        <div className={styles.imageWrapper}>
                            <img src={src} alt={alt || 'Content visual'} className={styles.contentImage} loading="lazy" />
                            {alt && <span className={styles.imageCaption}>{alt}</span>}
                        </div>
                    ),
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
                        const match = /language-(\S+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        const isInline = !className;
                        const codeString = String(children || '').replace(/\n$/, '');

                        if (lang.startsWith('__snippet__:')) {
                            const snippetId = lang.replace('__snippet__:', '');
                            const snippet = snippetMap.get(snippetId);
                            if (snippet) {
                                return <RunnableCodeBlock snippet={snippet} />;
                            }
                        }

                        if (isInline) {
                            return <code className="inline-code" {...rest}>{children}</code>;
                        }

                        const cleanLang = (lang || '').trim().toLowerCase();
                        if (cleanLang === 'mermaid') {
                            return <MermaidDiagram chart={codeString} />;
                        }

                        const executable = isExecutableLanguage(cleanLang);
                        const preparedCode = executable ? formatExecutableCode(codeString, cleanLang) : codeString;

                        return (
                            <StudyCodeBlock
                                codeString={codeString}
                                preparedCode={preparedCode}
                                lang={cleanLang}
                                executable={executable}
                                onOpenPlayground={handleOpenPlaygroundDrawer}
                            />
                        );
                    }
                }}
            >
                {processedContent}
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
                                {(() => {
                                    const totalTopicMinutes = subtopics.reduce((acc, st) => acc + (st.estimatedMinutes || 5), 0);
                                    if (totalTopicMinutes >= 60) {
                                        return totalTopicMinutes % 60 === 0
                                            ? `${totalTopicMinutes / 60} ${totalTopicMinutes / 60 === 1 ? 'hour' : 'hours'}`
                                            : `${Math.floor(totalTopicMinutes / 60)}h ${totalTopicMinutes % 60}m`;
                                    }
                                    return totalTopicMinutes > 0 ? `${totalTopicMinutes} mins` : (topic.duration || '15 mins');
                                })()}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {sec.isCompleted ? (
                                            <div className={styles.nodeCompletedBadge}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className={styles.nodePendingBadge} />
                                        )}
                                        <span className={styles.tocName}>{sec.title}</span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main reading content pane */}
                <main className={styles.contentPane} ref={contentPaneRef}>
                    {activeSubtopic ? (
                        <div className={isNotesDrawerOpen ? styles.contentFlexLayout : ''}>
                            <article className={styles.article}>
                                <div className={styles.subtopicHeaderRow}>
                                    <div>
                                        <h1 className={styles.sectionTitle}>{activeSubtopic.title}</h1>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                                            <LevelBadge level={activeSubtopic.level} />
                                            {activeSubtopic.track && <TrackBadge track={activeSubtopic.track} />}
                                            <DurationBadge minutes={activeSubtopic.estimatedMinutes || 5} />
                                        </div>
                                    </div>
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

                                {(() => {
                                    const uncompletedPrereqs = (activeSubtopic.prerequisites || [])
                                        .map(reqId => {
                                            const match = subtopics.find(s => {
                                                const sId = String(s.id).toLowerCase();
                                                const rId = String(reqId).toLowerCase();
                                                if (sId === rId) return true;

                                                const sClean = s.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                const rClean = rId.replace(/[^a-z0-9]/g, '');
                                                if (sClean && rClean && (rClean.includes(sClean) || sClean.includes(rClean))) return true;

                                                return false;
                                            });

                                            return {
                                                title: match ? match.title : reqId.replace(/-/g, ' '),
                                                isCompleted: match ? Boolean(match.isCompleted) : false
                                            };
                                        })
                                        .filter(req => !req.isCompleted);

                                    if (uncompletedPrereqs.length === 0) return null;

                                    return (
                                        <div className={styles.prereqBanner}>
                                            <strong>📌 Prerequisites:</strong> Recommended reading first:{' '}
                                            {uncompletedPrereqs.map(r => r.title).join(', ')}
                                        </div>
                                    );
                                })()}

                                {activeSubtopic.videoUrl && (
                                    <YouTubeEmbed url={activeSubtopic.videoUrl} />
                                )}

                                <div className={styles.articleBody}>
                                    {renderContent(activeSubtopic.content)}
                                    {activeSubtopic.questions && activeSubtopic.questions.length > 0 && (
                                        <div className={styles.mcqSection}>
                                            <div className={styles.mcqSectionHeader}>
                                                <i className="fa-solid fa-circle-question" aria-hidden="true" />
                                                <span>Concept Check</span>
                                                <span className={styles.mcqCount}>{activeSubtopic.questions.length} Question{activeSubtopic.questions.length > 1 ? 's' : ''}</span>
                                            </div>
                                            <div style={{ padding: '24px' }}>
                                            <ContentRenderer
                                                hideHeader={true}
                                                isSubtopicCompleted={Boolean(activeSubtopic.isCompleted)}
                                                blocks={[{
                                                    id: `quiz-${activeSubtopic.id || activeSubtopicIndex}`,
                                                    orderIndex: 1,
                                                    type: 'quiz',
                                                    questions: activeSubtopic.questions.map((q, qIdx) => ({
                                                        id: q.id || `q-${activeSubtopic.id || activeSubtopicIndex}-${qIdx}`,
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

                            {/* In-pane side slider Code Playground Panel */}
                            <PlaygroundSidePanel
                                isOpen={playgroundDrawer.isOpen}
                                initialCode={playgroundDrawer.code}
                                language={playgroundDrawer.language}
                                onClose={() => setPlaygroundDrawer(prev => ({ ...prev, isOpen: false }))}
                                onOpenFullCompiler={onOpenFullCompiler}
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

                {activeSubtopicIndex === subtopics.length - 1 && onSelectNextTopic ? (
                    <button 
                        className={`${styles.navBtn} ${styles.nextTopicBtn}`} 
                        onClick={onSelectNextTopic}
                        title="Proceed to Next Topic in Path"
                    >
                        Next Topic
                        <ChevronRight size={18} />
                    </button>
                ) : (
                    <button 
                        className={styles.navBtn} 
                        onClick={handleNext} 
                        disabled={subtopics.length === 0 || activeSubtopicIndex === subtopics.length - 1}
                    >
                        Next
                        <ChevronRight size={18} />
                    </button>
                )}
            </footer>
        </div>
    );
}
