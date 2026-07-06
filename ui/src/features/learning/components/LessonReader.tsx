import React, { useState, useEffect } from 'react';
import type { Course, Lesson, UserProgress } from '../types';
import { Button } from '../../../shared/components/Button/Button';
import { 
    CheckIcon, 
    ChevronRightIcon, 
    ChevronDownIcon, 
    MenuIcon
} from '../../../shared/components/Icons';
import styles from './LessonReader.module.css';

// SVG Icons directly
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const splitContent = (content: string) => {
    const takeawaysMarker = '## ## Key Takeaways';
    const markerIdx = content.indexOf(takeawaysMarker);
    
    if (markerIdx === -1) {
        return { mainContent: content, takeaways: null };
    }
    
    return {
        mainContent: content.substring(0, markerIdx),
        takeaways: content.substring(markerIdx + takeawaysMarker.length)
    };
};

interface LessonReaderProps {
    course: Course;
    lesson: Lesson | null;
    progress: UserProgress[];
    onBack: () => void;
    onSelectLesson: (id: number) => void;
    onMarkCompleted: (id: number) => void;
    onSubmitQuiz: (lessonId: number, score: number) => void;
    onChangeView: (view: any) => void;
}

export const LessonReader: React.FC<LessonReaderProps> = ({
    course,
    lesson,
    progress,
    onBack,
    onSelectLesson,
    onMarkCompleted,
    onSubmitQuiz,
    onChangeView
}) => {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
    
    // Quiz State
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [submittedQuiz, setSubmittedQuiz] = useState<boolean>(false);
    const [quizResultScore, setQuizResultScore] = useState<number>(0);
    const [quizPassed, setQuizPassed] = useState<boolean>(false);
    
    // Coding Sandbox State
    const [sandboxCode, setSandboxCode] = useState<string>('');
    const [sandboxOutput, setSandboxOutput] = useState<string>('');
    const [sandboxRunning, setSandboxRunning] = useState<boolean>(false);
    const [sandboxSuccess, setSandboxSuccess] = useState<boolean>(false);

    // Initialize sidebar module expansions & quiz state
    useEffect(() => {
        if (course.modules) {
            const initialExp: Record<number, boolean> = {};
            course.modules.forEach(m => {
                // Expand the module that contains the active lesson
                const hasActive = m.lessons?.some(l => l.id === lesson?.id);
                initialExp[m.id] = hasActive || false;
            });
            setExpandedModules(initialExp);
        }

        // Reset quiz and code state
        setSelectedAnswers({});
        setSubmittedQuiz(false);
        setQuizResultScore(0);
        setQuizPassed(false);
        setSandboxOutput('');
        setSandboxSuccess(false);

        // Prepopulate sandbox depending on lesson
        if (lesson) {
            if (lesson.id === 1) {
                setSandboxCode('// Try editing this GET fetch call!\nfetch(\'/api/courses\')\n  .then(res => res.json())\n  .then(data => console.log("Fetched courses:", data.length));');
            } else if (lesson.id === 3) {
                setSandboxCode('// Implement a React counter click hook\nconst [count, setCount] = useState(0);\nconsole.log("Current click count:", count);');
            } else if (lesson.id === 5) {
                setSandboxCode('// Java REST Controller mapping\n@GetMapping("/greet")\npublic String greet() {\n    return "Hello Developer";\n}');
            } else {
                setSandboxCode('// Sandbox terminal. Type javascript code here...\nconsole.log("Ready to execute sandbox script...");');
            }
        }
    }, [course, lesson]);

    if (!lesson) {
        return <div className={styles.loading}>Loading lesson reader workbench...</div>;
    }

    const toggleModule = (id: number) => {
        setExpandedModules(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const isLessonCompleted = (lessonId: number): boolean => {
        return progress.some(p => p.lessonId === lessonId && p.completed);
    };

    // Find next and previous lessons for navigation
    const allLessons = course.modules?.flatMap(m => m.lessons || []) || [];
    const activeIndex = allLessons.findIndex(l => l.id === lesson.id);
    const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
    const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

    const handleNextClick = () => {
        if (nextLesson) {
            onSelectLesson(nextLesson.id);
        } else {
            // Reached the end! Change view to dashboard
            onChangeView('DASHBOARD');
        }
    };

    const handlePrevClick = () => {
        if (prevLesson) {
            onSelectLesson(prevLesson.id);
        }
    };

    // Quiz evaluation
    const handleSelectOption = (questionId: number, optionIndex: number) => {
        if (submittedQuiz) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleQuizSubmit = () => {
        if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) return;
        
        let correctCount = 0;
        lesson.quizQuestions.forEach(q => {
            if (selectedAnswers[q.id] === q.correctAnswerIndex) {
                correctCount++;
            }
        });

        const percentage = Math.round((correctCount / lesson.quizQuestions.length) * 100);
        setQuizResultScore(percentage);
        setSubmittedQuiz(true);
        setQuizPassed(percentage === 100);

        onSubmitQuiz(lesson.id, percentage);
        if (percentage === 100) {
            onMarkCompleted(lesson.id);
        }
    };

    // Sandbox execution
    const runSandbox = () => {
        setSandboxRunning(true);
        setSandboxOutput('Loading sandbox compilation environment...\n');
        
        setTimeout(() => {
            setSandboxOutput(prev => prev + 'Running checks...\n');
            setTimeout(() => {
                let logs = '';
                let passed = false;

                // Mock evaluations based on code contents
                if (lesson.id === 1) {
                    logs += '> node fetch_test.js\n';
                    logs += 'Connection established with port 8080\n';
                    logs += 'GET /api/courses HTTP/1.1 -> 200 OK\n';
                    logs += 'Console log: Fetched courses: 4\n';
                    passed = sandboxCode.includes('fetch');
                } else if (lesson.id === 3) {
                    logs += '> npm run build && node react_render.js\n';
                    logs += 'Component counter mounted\n';
                    logs += 'Interactive state evaluations loaded\n';
                    logs += 'Console log: Current click count: 0\n';
                    passed = sandboxCode.includes('useState') || sandboxCode.includes('count');
                } else if (lesson.id === 5) {
                    logs += '> javac HelloController.java && java HelloController\n';
                    logs += 'Spring Boot mapping: mapping registered under HTTP GET /greet\n';
                    logs += 'Response body evaluated successfully\n';
                    passed = sandboxCode.includes('@GetMapping') || sandboxCode.includes('greet');
                } else {
                    logs += 'Compilation successful\n';
                    logs += 'Execution complete. Terminated with code 0\n';
                    passed = true;
                }

                setSandboxRunning(false);
                setSandboxOutput(logs);
                setSandboxSuccess(passed);

                if (passed) {
                    setSandboxOutput(prev => prev + '\n✓ Exercise Passed! Dynamic criteria successfully met.');
                } else {
                    setSandboxOutput(prev => prev + '\n⚠️ Exercise failed. Double check implementation keywords.');
                }
            }, 800);
        }, 600);
    };

    // Custom Simple Markdown-like Content Renderer
    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            if (line.startsWith('### ')) {
                return <h3 key={idx} className={styles.mdH3}>{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={idx} className={styles.mdH2}>{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('# ')) {
                return <h1 key={idx} className={styles.mdH1}>{line.replace('# ', '')}</h1>;
            }
            if (line.startsWith('- ')) {
                return <li key={idx} className={styles.mdLi}>{line.replace('- ', '')}</li>;
            }
            if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                return <li key={idx} className={styles.mdLiOl}>{line}</li>;
            }
            if (line.startsWith('> ')) {
                return <blockquote key={idx} className={styles.mdBlockquote}>{line.replace('> ', '')}</blockquote>;
            }
            if (line.startsWith('```')) {
                // If it is just closing block, render empty
                if (line === '```' || line === '```bash' || line === '```tsx' || line === '```java' || line === '```typescript') {
                    return null;
                }
            }
            // Code block styling detection (crude lines evaluation)
            if (line.trim().startsWith('+--') || line.trim().startsWith('|') || line.trim().startsWith('npm ') || line.trim().startsWith('mvn ') || line.trim().startsWith('cd ') || line.trim().startsWith('import ') || line.trim().startsWith('export ') || line.trim().startsWith('public class ') || line.trim().startsWith('private ') || line.trim().startsWith('const ') || line.trim().startsWith('useEffect')) {
                return <pre key={idx} className={styles.mdCode}>{line}</pre>;
            }
            if (line.trim() === '') {
                return <div key={idx} style={{ height: '12px' }} />;
            }
            return <p key={idx} className={styles.mdPara}>{line}</p>;
        });
    };

    return (
        <div className={styles.container}>
            {/* Sidebar Navigation */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarCollapsed}`}>
                <div className={styles.sidebarHeader}>
                    <h4 className={styles.courseHeaderTitle}>{course.title}</h4>
                    <button className={styles.closeSidebarBtn} onClick={() => setSidebarOpen(false)}>
                        <CloseIcon />
                    </button>
                </div>

                <div className={styles.sidebarContent}>
                    {course.modules?.map(mod => {
                        const isExpanded = expandedModules[mod.id] || false;
                        
                        return (
                            <div key={mod.id} className={styles.sidebarModule}>
                                <div 
                                    className={styles.moduleHeaderRow}
                                    onClick={() => toggleModule(mod.id)}
                                >
                                    <span className={styles.moduleTitle}>
                                        Module {mod.orderIndex}: {mod.title}
                                    </span>
                                    {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                                </div>

                                {isExpanded && (
                                    <div className={styles.moduleLessons}>
                                        {mod.lessons?.map(les => {
                                            const completed = isLessonCompleted(les.id);
                                            const isActive = les.id === lesson.id;
                                            
                                            return (
                                                <div 
                                                    key={les.id}
                                                    className={`${styles.sidebarLessonItem} ${isActive ? styles.sidebarLessonItemActive : ''}`}
                                                    onClick={() => onSelectLesson(les.id)}
                                                >
                                                    <div className={`${styles.checkBubble} ${completed ? styles.checkBubbleCompleted : ''}`}>
                                                        {completed && <CheckIcon size={12} />}
                                                    </div>
                                                    <span className={styles.sidebarLessonTitle}>{les.title}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Main Content Pane */}
            <div className={styles.mainReader}>
                {/* Header Navbar */}
                <header className={styles.readerHeader}>
                    <div className={styles.readerHeaderLeft}>
                        {!sidebarOpen && (
                            <button className={styles.openSidebarBtn} onClick={() => setSidebarOpen(true)}>
                                <MenuIcon size={20} />
                            </button>
                        )}
                        <span className={styles.courseNavBreadcrumb} onClick={onBack}>
                            {course.title}
                        </span>
                        <span className={styles.divider}>/</span>
                        <span className={styles.lessonBreadcrumb}>{lesson.title}</span>
                    </div>

                    <div className={styles.readerHeaderRight}>
                        <Button variant="secondary" size="sm" onClick={onBack}>
                            Exit Course
                        </Button>
                    </div>
                </header>

                {/* Lesson Contents Scroll Area */}
                <div className={styles.scrollArea}>
                    <div className={styles.contentContainer}>
                        {/* Title and Module details */}
                        <div className={styles.lessonMetaHeader}>
                            <span className={styles.durationTag}>{lesson.durationMinutes} minutes read</span>
                            <h1 className={styles.lessonHeadingTitle}>{lesson.title}</h1>
                        </div>

                        {/* Markdown Lesson Content */}
                        <div className={styles.lessonText}>
                            {renderMarkdown(splitContent(lesson.content || '').mainContent)}
                        </div>

                        {/* Highlighted Key Takeaways Box */}
                        {splitContent(lesson.content || '').takeaways && (
                            <div className={styles.takeawaysContainer}>
                                <div className={styles.takeawaysHeader}>
                                    <svg className={styles.takeawaysIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-.304 0-.604-.04-.9-.12l-.548-.547z"/>
                                    </svg>
                                    <h3>Key Takeaways</h3>
                                </div>
                                <div className={styles.takeawaysContent}>
                                    {renderMarkdown(splitContent(lesson.content || '').takeaways || '')}
                                </div>
                            </div>
                        )}

                        {/* Interactive Developer Code Sandbox */}
                        <div className={styles.sandboxContainer}>
                            <div className={styles.sandboxHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.25rem' }}>💻</span>
                                    <h4 className={styles.sandboxTitle}>Sandbox Terminal Playground</h4>
                                </div>
                                <span className={styles.sandboxPill}>Developer Lab</span>
                            </div>
                            <div className={styles.sandboxBody}>
                                <div className={styles.editorPane}>
                                    <label className={styles.paneLabel}>Exercise workspace</label>
                                    <textarea 
                                        className={styles.editorTextArea}
                                        value={sandboxCode}
                                        onChange={(e) => setSandboxCode(e.target.value)}
                                        rows={8}
                                    />
                                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button 
                                            variant="primary" 
                                            size="sm"
                                            onClick={runSandbox}
                                            isLoading={sandboxRunning}
                                        >
                                            Execute Script
                                        </Button>
                                    </div>
                                </div>
                                <div className={`${styles.consolePane} ${sandboxSuccess ? styles.consoleSuccess : ''}`}>
                                    <label className={styles.paneLabel}>Console output log</label>
                                    <pre className={styles.consolePre}>
                                        {sandboxOutput || '$ Click "Execute Script" to evaluate code compilation...'}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Multiple Choice Quizzes */}
                        {lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
                            <div className={styles.quizCard}>
                                <h3 className={styles.quizHeaderTitle}>Lesson Knowledge Check</h3>
                                <p className={styles.quizHeaderDesc}>Complete the following validation questions to mark this lesson as passed.</p>

                                <div className={styles.questionsList}>
                                    {lesson.quizQuestions.map((q, qIdx) => {
                                        const chosenAnswer = selectedAnswers[q.id];
                                        
                                        return (
                                            <div key={q.id} className={styles.questionItem}>
                                                <h4 className={styles.questionText}>
                                                    {qIdx + 1}. {q.questionText}
                                                </h4>
                                                
                                                <div className={styles.optionsList}>
                                                    {q.options.map((opt, oIdx) => {
                                                        const isSelected = chosenAnswer === oIdx;
                                                        const isCorrect = q.correctAnswerIndex === oIdx;
                                                        
                                                        let optionClass = styles.optionItem;
                                                        if (isSelected) optionClass += ` ${styles.optionSelected}`;
                                                        if (submittedQuiz) {
                                                            if (isCorrect) optionClass += ` ${styles.optionCorrect}`;
                                                            else if (isSelected) optionClass += ` ${styles.optionIncorrect}`;
                                                        }
                                                        
                                                        return (
                                                            <div 
                                                                key={oIdx} 
                                                                className={optionClass}
                                                                onClick={() => handleSelectOption(q.id, oIdx)}
                                                            >
                                                                <div className={styles.optionBubble}>
                                                                    {String.fromCharCode(65 + oIdx)}
                                                                </div>
                                                                <span>{opt}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {submittedQuiz && chosenAnswer !== undefined && (
                                                    <div className={`${styles.explanationBox} ${chosenAnswer === q.correctAnswerIndex ? styles.explanationCorrect : styles.explanationIncorrect}`}>
                                                        <strong>{chosenAnswer === q.correctAnswerIndex ? "✓ Correct!" : "✗ Incorrect."}</strong>
                                                        <p>{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={styles.quizAction}>
                                    {!submittedQuiz ? (
                                        <Button 
                                            variant="primary" 
                                            onClick={handleQuizSubmit}
                                            disabled={Object.keys(selectedAnswers).length < (lesson.quizQuestions?.length || 0)}
                                        >
                                            Submit Answers
                                        </Button>
                                    ) : (
                                        <div className={styles.quizResultRow}>
                                            <div className={`${styles.scoreBanner} ${quizPassed ? styles.scoreBannerPassed : styles.scoreBannerFailed}`}>
                                                <span>Grade: <strong>{quizResultScore}%</strong></span>
                                                <span>{quizPassed ? "✓ Grade criteria met (100%)" : "⚠️ Needs 100% score to pass lesson"}</span>
                                            </div>
                                            {!quizPassed && (
                                                <Button variant="secondary" onClick={() => { setSubmittedQuiz(false); setSelectedAnswers({}); }}>
                                                    Retry Quiz
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action Navigation */}
                <footer className={styles.readerFooterBar}>
                    <button 
                        className={`${styles.navGoogleBtn} ${styles.prevBtn}`}
                        onClick={handlePrevClick}
                        disabled={!prevLesson}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>Previous</span>
                    </button>

                    <Button 
                        variant={isLessonCompleted(lesson.id) ? "secondary" : "primary"}
                        onClick={() => { onMarkCompleted(lesson.id); }}
                        disabled={isLessonCompleted(lesson.id)}
                    >
                        {isLessonCompleted(lesson.id) ? "✓ Completed" : "Mark as Complete"}
                    </Button>

                    <button 
                        className={`${styles.navGoogleBtn} ${styles.nextBtn}`}
                        onClick={handleNextClick}
                    >
                        <span>Next</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </footer>
            </div>
        </div>
    );
};
export default LessonReader;
