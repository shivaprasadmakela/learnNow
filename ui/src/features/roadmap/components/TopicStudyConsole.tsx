import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, BookOpen, Clock } from 'lucide-react';
import type { TopicDetails, SubtopicData } from '../../../shared/api/profile.api';
import styles from '../styles/TopicStudyConsole.module.css';

interface TopicStudyConsoleProps {
    topic: TopicDetails;
    onClose: () => void;
    onToggleComplete: () => Promise<void>;
    isUpdating: boolean;
}

export function TopicStudyConsole({ 
    topic, 
    onClose, 
    onToggleComplete, 
    isUpdating
}: TopicStudyConsoleProps) {
    const [activeSubtopicIndex, setActiveSubtopicIndex] = useState(0);

    const subtopics = topic.subtopics || [];
    const activeSubtopic: SubtopicData | undefined = subtopics[activeSubtopicIndex];

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
                        <h2 className={styles.subtopicTitle}>{topic.title}</h2>
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
                        Section {activeSubtopicIndex + 1} of {subtopics.length}
                    </span>
                    <div className={styles.progressBarBg}>
                        <div 
                            className={styles.progressBarFill} 
                            style={{ width: `${subtopics.length > 0 ? ((activeSubtopicIndex + 1) / subtopics.length) * 100 : 0}%` }}
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
                        {subtopics.map((sec, idx) => (
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
                                    <span className={styles.tocIndex}>{idx + 1}</span>
                                    <span className={styles.tocName}>{sec.title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main reading content pane */}
                <main className={styles.contentPane}>
                    {activeSubtopic ? (
                        <article className={styles.article}>
                            <h1 className={styles.sectionTitle}>{activeSubtopic.title}</h1>
                            <div className={styles.articleBody}>
                                {renderContent(activeSubtopic.content)}
                            </div>
                        </article>
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
                    disabled={isUpdating}
                >
                    {topic.isCompleted ? (
                        <>
                            <Check size={16} />
                            Topic Completed!
                        </>
                    ) : (
                        "Mark Topic as Completed"
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
