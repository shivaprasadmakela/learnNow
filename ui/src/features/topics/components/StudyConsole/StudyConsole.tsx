import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, Check, BookOpen, Clock, CheckCircle2, FileText, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchLesson, type LessonOutline, type SubtopicData, type TopicDetails } from '../../../../shared/api/profile.api';
import { ContentRenderer } from '../../../../shared/components/content-renderer/ContentRenderer';
import { CodeBlock } from '../../../../shared/components/ui/CodeBlock';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import { slugify } from '../../../../shared/utils/slug';
import { RunnableCodeBlock } from '../../../../shared/components/ui/RunnableCodeBlock';
import { YouTubeEmbed } from '../../../../shared/components/ui/YouTubeEmbed';
import { LevelBadge, TrackBadge, DurationBadge } from '../../../../shared/components/ui/Badge';
import { useNote, useBookmarks, BookmarkButton, NotesPanel } from '../../../notes';
import {
    TopicInterviewNav,
    TopicInterviewSection,
    interviewAnchorId,
    useTopicInterviewQuestions,
    type InterviewQuestion
} from '../../../interview';
import { PlaygroundSidePanel } from '../PlaygroundSidePanel';
import { TopicCelebrationModal } from '../TopicCelebrationModal/TopicCelebrationModal';
import { useLessons } from './useLessons';
import { setTrainerPage, TopicInterviewOffer } from '../../../trainer';

const TopicInterviewFlow = React.lazy(() =>
    import('../../../trainer').then(m => ({ default: m.TopicInterviewFlow }))
);
import styles from './StudyConsole.module.css';

interface StudyConsoleProps {
    topic: TopicDetails;
    onClose: () => void;
    onToggleComplete: () => Promise<void>;
    onToggleSubtopicComplete?: (subtopicId: string | number, completed: boolean) => Promise<void>;
    onSelectNextTopic?: () => void;
    nextTopicTitle?: string;
    onOpenFullCompiler?: (code: string, language: string) => void;
    isUpdating: boolean;
    /**
     * Loads one lesson in full when it is shown. Defaults to the API; the admin preview passes
     * its own, over content that is not published yet.
     */
    loadLesson?: (id: string | number) => Promise<SubtopicData>;
}

/** What the content pane shows: the lessons, or the topic's interview questions. */
type ConsolePane = 'lessons' | 'interview';

export function StudyConsole({ 
    topic, 
    onClose, 
    onToggleComplete, 
    onToggleSubtopicComplete,
    onSelectNextTopic,
    nextTopicTitle,
    onOpenFullCompiler,
    isUpdating,
    loadLesson = fetchLesson
}: StudyConsoleProps) {
    const subtopics = topic.subtopics || [];

    // Calculate initial active subtopic index from URL parameters
    const initialActiveIdx = (() => {
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
    })();

    const [activeSubtopicIndex, setActiveSubtopicIndex] = useState<number>(initialActiveIdx);

    // Visible subtopic count in continuous scroll feed must include the clicked active subtopic
    const [visibleCount, setVisibleCount] = useState<number>(() => {
        if (subtopics.length === 0) return 0;
        const firstUncompletedIdx = subtopics.findIndex(s => !s.isCompleted);
        const baseUncompleted = firstUncompletedIdx === -1 ? subtopics.length : firstUncompletedIdx + 1;
        return Math.max(1, initialActiveIdx + 1, baseUncompleted);
    });

    // Track per-subtopic MCQ completion state
    const [answeredQuizzesMap, setAnsweredQuizzesMap] = useState<Record<string | number, boolean>>({});

    const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isTopicCelebrationOpen, setIsTopicCelebrationOpen] = useState(false);
    const [isInterviewFlowOpen, setIsInterviewFlowOpen] = useState(false);

    // Interview questions sit in their own pane, reached from the table of contents: they test a
    // whole topic, so they belong beside the lessons rather than inside any one of them.
    // The count arrives with the topic; the questions load only when the pane is opened.
    const interviewCount = topic.interviewQuestionCount ?? 0;
    // Kept with the topic it was chosen for, so moving to another topic opens on its lessons.
    const [paneChoice, setPaneChoice] = useState<{ topicId: string; pane: ConsolePane }>({
        topicId: String(topic.id),
        pane: 'lessons'
    });
    const pane = paneChoice.topicId === String(topic.id) ? paneChoice.pane : 'lessons';
    const setPane = (next: ConsolePane) => setPaneChoice({ topicId: String(topic.id), pane: next });
    const showInterview = pane === 'interview' && interviewCount > 0;
    const interviewQuestions = useTopicInterviewQuestions(showInterview ? topic.id : undefined).data ?? [];

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
    const activeSubtopic: LessonOutline | undefined = subtopics[activeSubtopicIndex];

    // Ask AI answers "explain this" about the lesson on screen.
    useEffect(() => {
        setTrainerPage(activeSubtopic ? { kind: 'subtopic', id: String(activeSubtopic.id) } : { kind: 'topic', id: String(topic.id) });
    }, [activeSubtopic, topic.id]);

    // Sync URL slug
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

    // Scroll to initial active subtopic on mount if specified in URL
    useEffect(() => {
        if (initialActiveIdx > 0 && subtopics[initialActiveIdx]) {
            isManualScrollRef.current = true;
            setTimeout(() => {
                const elem = document.getElementById(`subtopic-${subtopics[initialActiveIdx].id}`);
                if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => {
                    isManualScrollRef.current = false;
                }, 600);
            }, 250);
        }
    }, []);

    const { isBookmarked, toggleBookmark } = useBookmarks();
    
    // Topic-Level Generic Notes Hook
    const {
        content: topicNoteContent,
        setContent: setTopicNoteContent,
        saveStatus: topicNoteSaveStatus,
        isLoading: isTopicNoteLoading,
        saveNow: saveTopicNoteNow
    } = useNote('TOPIC', topic.id, isNotesDrawerOpen);

    const completedSubtopicsCount = subtopics.filter((s: LessonOutline) => s.isCompleted).length;

    const computedPercentage = topic.isCompleted ? 100 : (
        subtopics.length > 0 ? Math.round((completedSubtopicsCount / subtopics.length) * 100) : (topic.progressPercentage || 0)
    );

    const isManualScrollRef = useRef(false);

    // Scroll spy: Dynamically highlight the active subtopic in Table of Contents based on scroll position
    useEffect(() => {
        const pane = contentPaneRef.current;
        if (!pane || subtopics.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (isManualScrollRef.current) return;
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const idStr = entry.target.id.replace('subtopic-', '');
                        const matchedIdx = subtopics.findIndex(s => String(s.id) === idStr);
                        if (matchedIdx !== -1) {
                            setActiveSubtopicIndex(matchedIdx);
                        }
                    }
                });
            },
            {
                root: pane,
                rootMargin: '-10% 0px -65% 0px',
                threshold: 0
            }
        );

        const rendered = subtopics.slice(0, Math.max(1, visibleCount));
        rendered.forEach(st => {
            const elem = document.getElementById(`subtopic-${st.id}`);
            if (elem) observer.observe(elem);
        });

        return () => observer.disconnect();
        // showInterview: returning to the lessons renders fresh elements that need observing again.
    }, [visibleCount, subtopics, showInterview]);

    const handleSubtopicChange = (index: number) => {
        if (index >= 0 && index < subtopics.length) {
            isManualScrollRef.current = true;
            if (index >= visibleCount) {
                setVisibleCount(index + 1);
            }
            setActiveSubtopicIndex(index);
            setIsTocOpen(false);

            setTimeout(() => {
                const elem = document.getElementById(`subtopic-${subtopics[index].id}`);
                if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => {
                    isManualScrollRef.current = false;
                }, 600);
            }, 100);
        }
    };

    const handleSelectPane = (next: ConsolePane) => {
        setPane(next);
        contentPaneRef.current?.scrollTo({ top: 0 });
    };

    const handleSelectInterviewQuestion = (question: InterviewQuestion) => {
        setPane('interview');
        setIsTocOpen(false);
        setTimeout(() => {
            document
                .getElementById(interviewAnchorId(question.id))
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    /** "Not sure? Revise the lesson" on a question: back to the lessons, at the one it names. */
    const handleRevise = (question: InterviewQuestion) => {
        const index = subtopics.findIndex(s => String(s.id) === String(question.subtopicId));
        setPane('lessons');
        if (index >= 0) setTimeout(() => handleSubtopicChange(index), 0);
    };

    const handleReadMore = async (subtopic: LessonOutline, index: number) => {
        // Check if completing this subtopic leaves 0 uncompleted subtopics in the topic
        const remainingUncompleted = subtopics.filter(s => !s.isCompleted && String(s.id) !== String(subtopic.id));
        const isTopicNowFullyCompleted = remainingUncompleted.length === 0;

        if (onToggleSubtopicComplete && !subtopic.isCompleted) {
            await onToggleSubtopicComplete(subtopic.id, true);
        }

        if (isTopicNowFullyCompleted) {
            if (!topic.isCompleted) {
                await onToggleComplete();
            }
            setIsTopicCelebrationOpen(true);
        } else {
            const nextIndex = index + 1;
            if (nextIndex < subtopics.length) {
                isManualScrollRef.current = true;
                setVisibleCount(prev => Math.max(prev, nextIndex + 1));
                setActiveSubtopicIndex(nextIndex);

                setTimeout(() => {
                    const nextElem = document.getElementById(`subtopic-${subtopics[nextIndex].id}`);
                    if (nextElem) {
                        nextElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    setTimeout(() => {
                        isManualScrollRef.current = false;
                    }, 600);
                }, 120);
            }
        }
    };

    const renderContent = (content: string, currentSubtopic: SubtopicData) => {
        if (!content) return null;

        const snippetMap = new Map((currentSubtopic.codeSnippets || []).map(s => [s.id, s]));

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
                                return <RunnableCodeBlock snippet={snippet} subtopicId={currentSubtopic.id} />;
                            }
                        }

                        if (isInline) {
                            return <code className="inline-code" {...rest}>{children}</code>;
                        }

                        return <CodeBlock code={codeString} lang={lang} onTryInPlayground={handleOpenPlaygroundDrawer} />;
                    }
                }}
            >
                {processedContent}
            </ReactMarkdown>
        );
    };

    const renderedSubtopics = subtopics.slice(0, Math.max(1, visibleCount));
    // The feed is unmounted behind the Interview pane, so it is handed over again on return and its
    // fresh elements are watched.
    const lessons = useLessons(
        showInterview ? [] : renderedSubtopics,
        subtopics[activeSubtopicIndex]?.id,
        loadLesson,
        contentPaneRef
    );

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
                                targetNoun="topic"
                                targetName={topic.title}
                            />
                            <button
                                type="button"
                                className={`${styles.headerNotesBtn} ${isNotesDrawerOpen ? styles.headerNotesBtnActive : ''}`}
                                onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}
                                title="Topic Notes"
                            >
                                <FileText size={14} />
                                <span>Notes</span>
                                {Boolean(topicNoteContent.trim()) && <span className={styles.topicNoteDot} />}
                            </button>
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
                <aside
                    className={`${styles.tocSidebar} ${isTocOpen ? styles.tocSidebarOpen : ''}`}
                    aria-label="Topic contents"
                >
                    {interviewCount > 0 && (
                        <Tabs<ConsolePane>
                            variant="compact"
                            label="Topic sections"
                            className={styles.tocTabs}
                            items={[
                                { id: 'lessons', label: 'Lessons', count: subtopics.length },
                                { id: 'interview', label: 'Interview', count: interviewCount }
                            ]}
                            activeId={showInterview ? 'interview' : 'lessons'}
                            onChange={handleSelectPane}
                        />
                    )}
                    {showInterview ? (
                        <TopicInterviewNav
                            questions={interviewQuestions}
                            onSelect={handleSelectInterviewQuestion}
                        />
                    ) : (
                    <ul className={styles.tocList}>
                        {subtopics.map((sec: LessonOutline, idx: number) => (
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
                    )}
                </aside>

                {/* Main continuous reading content pane */}
                <main className={styles.contentPane} ref={contentPaneRef}>
                    {subtopics.length > 0 ? (
                        <div className={isNotesDrawerOpen ? styles.contentFlexLayout : ''}>
                            {showInterview ? (
                                <div className={styles.article}>
                                    <TopicInterviewOffer
                                        topicId={String(topic.id)}
                                        topicTitle={topic.title}
                                        onStartInterview={() => setIsInterviewFlowOpen(true)}
                                    />
                                    <TopicInterviewSection
                                        topicTitle={topic.title}
                                        questions={interviewQuestions}
                                        onRevise={handleRevise}
                                    />
                                </div>
                            ) : (
                            <div className={styles.article}>
                                {renderedSubtopics.map((st: LessonOutline, index: number) => {
                                    // The outline is here at once; the lesson itself arrives as it is shown.
                                    const lesson = lessons[String(st.id)];
                                    const hasQuizzes = (st.quizCount ?? lesson?.questions?.length ?? 0) > 0;
                                    const isQuizPassed = Boolean(answeredQuizzesMap[st.id]);
                                    const canReadMore = !hasQuizzes || isQuizPassed;

                                    return (
                                        <article
                                            key={st.id || index}
                                            id={`subtopic-${st.id}`}
                                            className={styles.subtopicBlock}
                                        >
                                            <div className={styles.subtopicHeaderRow}>
                                                <div>
                                                    <h1 className={styles.sectionTitle}>{st.title}</h1>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                                                        <LevelBadge level={st.level} />
                                                        {st.track && <TrackBadge track={st.track} />}
                                                        <DurationBadge minutes={st.estimatedMinutes || 5} />
                                                    </div>
                                                </div>
                                            </div>

                                            {(() => {
                                                const uncompletedPrereqs = (lesson?.prerequisites || [])
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

                                            {lesson?.videoUrl && (
                                                <YouTubeEmbed url={lesson.videoUrl} />
                                            )}

                                            <div className={styles.articleBody}>
                                                {!lesson && (
                                                    <p className={`${styles.paragraph} ${styles.lessonPending}`} aria-busy="true">Loading this section…</p>
                                                )}
                                                {lesson && renderContent(lesson.content, lesson)}
                                                {lesson?.questions && lesson.questions.length > 0 && (
                                                    <div className={styles.mcqSection}>
                                                        <div className={styles.mcqSectionHeader}>
                                                            <i className="fa-solid fa-circle-question" aria-hidden="true" />
                                                            <span>Concept Check</span>
                                                            <span className={styles.mcqCount}>{lesson.questions.length} Question{lesson.questions.length > 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div style={{ padding: '24px' }}>
                                                            <ContentRenderer
                                                                hideHeader={true}
                                                                isSubtopicCompleted={Boolean(st.isCompleted)}
                                                                blocks={[{
                                                                    id: `quiz-${st.id || index}`,
                                                                    orderIndex: 1,
                                                                    type: 'quiz',
                                                                    questions: lesson.questions.map((q, qIdx) => ({
                                                                        id: q.id || `q-${st.id || index}-${qIdx}`,
                                                                        kind: q.kind || 'mcq',
                                                                        prompt: q.prompt,
                                                                        options: q.options,
                                                                        correctAnswer: q.correctAnswer,
                                                                        explanation: q.explanation,
                                                                        points: q.points,
                                                                        attempt: q.attempt,
                                                                    })),
                                                                }]}
                                                                onAllQuizzesAnsweredChange={(allAnswered) => {
                                                                    setAnsweredQuizzesMap(prev => ({ ...prev, [st.id]: allAnswered }));
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progressive Read More / Completion Container */}
                                            <div className={styles.readMoreContainer}>
                                                {st.isCompleted ? (
                                                    <div className={styles.readMoreCompletedBadge}>
                                                        <CheckCircle2 size={16} /> Section Completed (+5 pts)
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={styles.readMoreBtn}
                                                        disabled={isUpdating || !canReadMore}
                                                        onClick={() => handleReadMore(st, index)}
                                                        title={
                                                            !canReadMore
                                                                ? 'Answer all MCQs in this section first'
                                                                : index === subtopics.length - 1
                                                                    ? 'Complete Topic'
                                                                    : 'Continue to Next Subtopic'
                                                        }
                                                    >
                                                        {index === subtopics.length - 1 ? (
                                                            <>
                                                                <Check size={18} />
                                                                Complete Topic (+10 pts)
                                                            </>
                                                        ) : (
                                                            <>
                                                                Read More & Continue
                                                                <ChevronRight size={18} />
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            )}

                            {/* In-pane corner slider Topic Notes Panel */}
                            <NotesPanel
                                isOpen={isNotesDrawerOpen}
                                title={`${topic.title} Notes`}
                                content={topicNoteContent}
                                onChange={setTopicNoteContent}
                                onSave={saveTopicNoteNow}
                                onClose={() => setIsNotesDrawerOpen(false)}
                                saveStatus={topicNoteSaveStatus}
                                isLoading={isTopicNoteLoading}
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

            {/* Topic Completion Celebration Modal Overlay */}
            <TopicCelebrationModal
                isOpen={isTopicCelebrationOpen}
                topicId={String(topic.id)}
                topicTitle={topic.title}
                problemsCount={subtopics.length}
                nextTopicTitle={nextTopicTitle}
                onStartInterview={() => {
                    setIsTopicCelebrationOpen(false);
                    setIsInterviewFlowOpen(true);
                }}
                onContinueNextTopic={() => {
                    setIsTopicCelebrationOpen(false);
                    if (onSelectNextTopic) {
                        onSelectNextTopic();
                    } else {
                        onClose();
                    }
                }}
                onClose={() => setIsTopicCelebrationOpen(false)}
            />

            {isInterviewFlowOpen && (
                <React.Suspense fallback={null}>
                    <TopicInterviewFlow
                        isOpen={isInterviewFlowOpen}
                        topicId={String(topic.id)}
                        topicTitle={topic.title}
                        onClose={() => setIsInterviewFlowOpen(false)}
                        onReviseLesson={subtopicId => {
                            setIsInterviewFlowOpen(false);
                            const index = subtopics.findIndex(s => String(s.id) === String(subtopicId));
                            setPane('lessons');
                            if (index >= 0) setTimeout(() => handleSubtopicChange(index), 0);
                        }}
                    />
                </React.Suspense>
            )}
        </div>
    );
}
