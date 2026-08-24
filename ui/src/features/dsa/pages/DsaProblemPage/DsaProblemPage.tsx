import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    Loader2,
    Play,
    Plus,
    RotateCcw,
    Send,
    Video,
    X
} from 'lucide-react';
import styles from './DsaProblemPage.module.css';
import { MonacoEditorPane } from '../../../../shared/components/editor';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import { DifficultyBadge } from '../../../../shared/components/ui/Badge';
import { ContentRenderer } from '../../../../shared/components/content-renderer';
import { YouTubeEmbed } from '../../../../shared/components/ui/YouTubeEmbed';
import { BookmarkButton, NotesPanel, useBookmarks, useNote } from '../../../notes';
import { useDsaProblem } from '../../hooks/useDsaProblem';
import { useProblemRun } from '../../hooks/useProblemRun';
import { useEditorTabs } from '../../hooks/useEditorTabs';
import { useSplitPane } from '../../hooks/useSplitPane';
import type {
    DsaApproach,
    DsaCaseResult,
    DsaRunResult,
    DsaSubmitResult
} from '../../api/dsa.api';

export interface DsaProblemPageProps {
    problemSlug: string;
    isLoggedIn: boolean;
    onBackToSheet: () => void;
    onNavigateProblem: (stepSlug: string, problemSlug: string) => void;
    onRequireLogin: () => void;
    /** Hands the current buffer to the standalone console, which stays a separate tool. */
    onOpenFullCompiler?: (code: string, language: string) => void;
}

type LeftTab = 'description' | 'editorial' | 'submissions' | 'note';

const VERDICT_LABEL: Record<string, string> = {
    ACCEPTED: 'Accepted',
    WRONG_ANSWER: 'Wrong answer',
    COMPILE_ERROR: 'Compile error',
    RUNTIME_ERROR: 'Runtime error',
    TIME_LIMIT: 'Time limit exceeded',
    ENGINE_ERROR: 'The judge is unavailable'
};

export const DsaProblemPage: React.FC<DsaProblemPageProps> = ({
    problemSlug,
    isLoggedIn,
    onBackToSheet,
    onNavigateProblem,
    onRequireLogin,
    onOpenFullCompiler
}) => {
    const { problem, isLoading, error, reload } = useDsaProblem(problemSlug);
    const { isBookmarked, toggleBookmark } = useBookmarks(true, 'DSA_PROBLEM');

    const [leftTab, setLeftTab] = useState<LeftTab>('description');
    const [language, setLanguage] = useState<string>('');
    const [revealedHints, setRevealedHints] = useState(0);
    const [approachIndex, setApproachIndex] = useState(0);

    const horizontal = useSplitPane({
        initial: 44,
        min: 25,
        max: 70,
        axis: 'x',
        storageKey: 'dsa_split_x'
    });
    const vertical = useSplitPane({
        initial: 34,
        min: 15,
        max: 70,
        axis: 'y',
        storageKey: 'dsa_split_y'
    });

    // Pick a language once the problem arrives: what the learner last used, else the first harness.
    useEffect(() => {
        if (!problem) return;
        const available = problem.harnesses.map(h => h.language);
        if (available.length === 0) {
            setLanguage('');
            return;
        }
        const last = problem.progress?.lastLanguage;
        setLanguage(last && available.includes(last) ? last : available[0]);
        setRevealedHints(0);
        setApproachIndex(0);
        setLeftTab('description');
    }, [problem]);

    const harness = problem?.harnesses.find(h => h.language === language);
    const starterCode = harness?.starterCode ?? '';

    const tabs = useEditorTabs(problemSlug, language || 'none', starterCode);
    const run = useProblemRun(problem?.id ?? '');

    const monacoLanguage = useMemo(() => {
        const map: Record<string, string> = {
            cpp: 'cpp',
            java: 'java',
            python: 'python',
            javascript: 'javascript',
            typescript: 'typescript',
            c: 'c',
            csharp: 'csharp',
            go: 'go'
        };
        return map[language] ?? 'plaintext';
    }, [language]);

    const code = tabs.activeTab?.code ?? '';

    const doRun = useCallback(() => {
        if (!problem || !language || run.isBusy) return;
        run.run(language, code);
    }, [problem, language, run, code]);

    const doSubmit = useCallback(async () => {
        if (!problem || !language || run.isBusy) return;
        const result = await run.submit(language, code);
        // An accepted submission moves the status server-side, so refresh what we show.
        if (result?.verdict === 'ACCEPTED') reload();
    }, [problem, language, run, code, reload]);

    // Ctrl/Cmd+Enter runs, adding Shift submits. Monaco binds plain Ctrl+Enter itself; this covers
    // the case where focus is anywhere else on the page.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') return;
            event.preventDefault();
            if (event.shiftKey) doSubmit();
            else doRun();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [doRun, doSubmit]);

    if (isLoading) return <div className={styles.state}>Loading problem...</div>;

    if (error || !problem) {
        return (
            <div className={styles.state}>
                <p>{error ?? 'That problem could not be found.'}</p>
                <button type="button" className={styles.backBtn} onClick={onBackToSheet}>
                    <ArrowLeft size={14} /> Back to the sheet
                </button>
            </div>
        );
    }

    const solved = problem.progress?.status === 'SOLVED';
    const bookmarked = isBookmarked(problem.id);
    const approaches = problem.approaches;
    const visibleApproach: DsaApproach | undefined = approaches[approachIndex];

    return (
        <div className={styles.shell}>
            {/* ── top bar ── */}
            <header className={styles.topBar}>
                <button type="button" className={styles.backBtn} onClick={onBackToSheet}>
                    <ArrowLeft size={14} /> Sheet
                </button>
                <span className={styles.crumb}>{problem.stepTitle}</span>
                <span className={styles.topTitle}>{problem.title}</span>

                <div className={styles.spacer} />

                <BookmarkButton
                    isBookmarked={bookmarked}
                    onToggle={() => (isLoggedIn ? toggleBookmark(problem.id) : onRequireLogin())}
                    showLabel={false}
                    targetNoun="problem"
                    targetName={problem.title}
                    size={14}
                />

                <button
                    type="button"
                    className={styles.iconBtn}
                    disabled={!problem.previousSlug}
                    onClick={() =>
                        problem.previousSlug && onNavigateProblem(problem.stepSlug, problem.previousSlug)
                    }
                    title="Previous problem"
                >
                    <ChevronLeft size={14} />
                </button>
                <button
                    type="button"
                    className={styles.iconBtn}
                    disabled={!problem.nextSlug}
                    onClick={() => problem.nextSlug && onNavigateProblem(problem.stepSlug, problem.nextSlug)}
                    title="Next problem"
                >
                    <ChevronRight size={14} />
                </button>

                {problem.judgeable ? (
                    <>
                        <button
                            type="button"
                            className={styles.runBtn}
                            onClick={doRun}
                            disabled={run.isBusy || !harness}
                            title="Run against the sample cases (Ctrl/Cmd+Enter)"
                        >
                            {run.phase === 'running' ? (
                                <Loader2 size={14} />
                            ) : (
                                <Play size={14} />
                            )}
                            Run
                        </button>
                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={doSubmit}
                            disabled={run.isBusy || !harness}
                            title="Submit against every case (Ctrl/Cmd+Shift+Enter)"
                        >
                            {run.phase === 'submitting' ? (
                                <Loader2 size={14} />
                            ) : (
                                <Send size={14} />
                            )}
                            Submit
                        </button>
                    </>
                ) : (
                    <ManualSolveButton problemId={problem.id} solved={solved} onDone={reload} />
                )}
            </header>

            {/* ── split body ── */}
            <div
                className={styles.body}
                ref={horizontal.setContainer}
                style={{ ['--left-width' as string]: `${horizontal.size}%` }}
            >
                {/* left: the writing */}
                <section className={styles.leftPane}>
                    <Tabs
                        items={[
                            { id: 'description', label: 'Description' },
                            { id: 'editorial', label: 'Editorial' },
                            { id: 'submissions', label: 'Submissions' },
                            { id: 'note', label: 'My note' }
                        ]}
                        activeId={leftTab}
                        onChange={setLeftTab}
                        variant="compact"
                        label="Problem panes"
                    />

                    <div className={styles.tabBody}>
                        {leftTab === 'description' && (
                            <>
                                <div className={styles.problemHead}>
                                    <h1 className={styles.problemTitle}>{problem.title}</h1>
                                    <div className={styles.metaRow}>
                                        <DifficultyBadge difficulty={problem.difficulty} />
                                        <span className={styles.metaText}>
                                            <Clock size={11} /> {problem.estimatedMinutes} min
                                        </span>
                                        {solved && (
                                            <span className={styles.solvedPill}>
                                                <Check size={11} /> Solved
                                            </span>
                                        )}
                                        {problem.youtubeUrl && (
                                            <span className={styles.metaText}>
                                                <Video size={11} /> walkthrough below
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ContentRenderer
                                    blocks={[
                                        {
                                            id: `${problem.id}-statement`,
                                            orderIndex: 0,
                                            type: 'markdown',
                                            body: problem.statement
                                        }
                                    ]}
                                    hideHeader
                                />

                                {problem.samples.length > 0 && (
                                    <>
                                        <h2 className={styles.sectionHead}>Examples</h2>
                                        {problem.samples.map((sample, index) => (
                                            <div key={sample.id} className={styles.example}>
                                                <div className={styles.exampleHead}>
                                                    Example {index + 1}
                                                </div>
                                                <div className={styles.exampleBody}>
                                                    <div className={styles.exampleRow}>
                                                        <span className={styles.exampleLabel}>
                                                            Input
                                                        </span>
                                                        <pre className={styles.exampleValue}>
                                                            {sample.input.trim()}
                                                        </pre>
                                                    </div>
                                                    <div className={styles.exampleRow}>
                                                        <span className={styles.exampleLabel}>
                                                            Output
                                                        </span>
                                                        <pre className={styles.exampleValue}>
                                                            {sample.expectedOutput.trim()}
                                                        </pre>
                                                    </div>
                                                    {sample.explanation && (
                                                        <p className={styles.exampleNote}>
                                                            {sample.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {problem.hints.length > 0 && (
                                    <>
                                        <h2 className={styles.sectionHead}>Hints</h2>
                                        <div className={styles.hintStack}>
                                            {problem.hints
                                                .slice(0, revealedHints)
                                                .map((hint, index) => (
                                                    <div key={hint.id} className={styles.hint}>
                                                        <span className={styles.hintIndex}>
                                                            Hint {index + 1}
                                                        </span>
                                                        {hint.body}
                                                    </div>
                                                ))}
                                            {revealedHints < problem.hints.length && (
                                                <button
                                                    type="button"
                                                    className={styles.revealBtn}
                                                    onClick={() => setRevealedHints(n => n + 1)}
                                                >
                                                    {revealedHints === 0
                                                        ? `Show a hint (${problem.hints.length} available)`
                                                        : `Show hint ${revealedHints + 1}`}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {leftTab === 'editorial' && (
                            <>
                                {approaches.length === 0 ? (
                                    <p className={styles.consoleHint}>
                                        The write-up for this problem is still being written.
                                    </p>
                                ) : (
                                    <>
                                        {/*
                                          Later approaches unlock in order, so a learner walks past
                                          brute force before optimal appears rather than jumping
                                          straight to the answer.
                                        */}
                                        <div className={styles.approachTabs}>
                                            {approaches.map((approach, index) => (
                                                <button
                                                    key={approach.id}
                                                    type="button"
                                                    className={`${styles.approachTab} ${
                                                        index === approachIndex
                                                            ? styles.approachTabActive
                                                            : ''
                                                    }`}
                                                    disabled={index > approachIndex + 1}
                                                    onClick={() => setApproachIndex(index)}
                                                    title={
                                                        index > approachIndex + 1
                                                            ? 'Read the earlier approaches first'
                                                            : undefined
                                                    }
                                                >
                                                    {approach.kind}
                                                </button>
                                            ))}
                                        </div>

                                        {visibleApproach && (
                                            <>
                                                <div className={styles.complexityRow}>
                                                    {visibleApproach.timeComplexity && (
                                                        <span className={styles.complexity}>
                                                            <span
                                                                className={styles.complexityLabel}
                                                            >
                                                                time
                                                            </span>
                                                            {visibleApproach.timeComplexity}
                                                        </span>
                                                    )}
                                                    {visibleApproach.spaceComplexity && (
                                                        <span className={styles.complexity}>
                                                            <span
                                                                className={styles.complexityLabel}
                                                            >
                                                                space
                                                            </span>
                                                            {visibleApproach.spaceComplexity}
                                                        </span>
                                                    )}
                                                </div>

                                                <ContentRenderer
                                                    blocks={[
                                                        {
                                                            id: `${visibleApproach.id}-intuition`,
                                                            orderIndex: 0,
                                                            type: 'markdown',
                                                            body:
                                                                visibleApproach.intuition +
                                                                (visibleApproach.code
                                                                    ? `\n\n\`\`\`${visibleApproach.language ?? ''}\n${visibleApproach.code}\n\`\`\``
                                                                    : '')
                                                        }
                                                    ]}
                                                    hideHeader
                                                />
                                            </>
                                        )}
                                    </>
                                )}

                                {problem.youtubeUrl && (
                                    <>
                                        <h2 className={styles.sectionHead}>Walkthrough</h2>
                                        <YouTubeEmbed url={problem.youtubeUrl} />
                                    </>
                                )}
                            </>
                        )}

                        {leftTab === 'submissions' && (
                            <SubmissionsTab problemId={problem.id} />
                        )}

                        {leftTab === 'note' && <NoteTab problemId={problem.id} />}
                    </div>
                </section>

                <div
                    className={`${styles.gutter} ${horizontal.isDragging ? styles.gutterActive : ''}`}
                    aria-label="Resize the description pane"
                    {...horizontal.gutterProps}
                />

                {/* right: editor over console */}
                <div
                    className={styles.rightPane}
                    ref={vertical.setContainer}
                    style={{ ['--console-height' as string]: `${vertical.size}%` }}
                >
                    <div className={styles.editorCell}>
                        <div className={styles.paneBar}>
                            {problem.harnesses.length > 0 ? (
                                <select
                                    className={styles.langSelect}
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                    aria-label="Language"
                                >
                                    {problem.harnesses.map(h => (
                                        <option key={h.language} value={h.language}>
                                            {h.language}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className={styles.metaText}>No editor for this problem</span>
                            )}

                            <div className={styles.editorTabs}>
                                {tabs.tabs.map(tab => (
                                    <span
                                        key={tab.id}
                                        className={`${styles.editorTab} ${
                                            tab.id === tabs.activeId ? styles.editorTabActive : ''
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className={styles.editorTabClose}
                                            onClick={() => tabs.setActiveId(tab.id)}
                                            style={{ color: 'inherit' }}
                                        >
                                            {tab.label}
                                        </button>
                                        {tabs.tabs.length > 1 && (
                                            <button
                                                type="button"
                                                className={styles.editorTabClose}
                                                onClick={() => tabs.closeTab(tab.id)}
                                                title={`Close ${tab.label}`}
                                            >
                                                <X size={11} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {tabs.canAddTab && (
                                    <button
                                        type="button"
                                        className={styles.editorTabClose}
                                        onClick={tabs.addTab}
                                        title="New scratch tab"
                                    >
                                        <Plus size={13} />
                                    </button>
                                )}
                            </div>

                            <div className={styles.spacer} />

                            {onOpenFullCompiler && harness && (
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => onOpenFullCompiler(code, language)}
                                    title="Open this buffer in the standalone console"
                                >
                                    <ExternalLink size={13} />
                                </button>
                            )}

                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={tabs.resetActive}
                                title="Back to the starter code"
                            >
                                <RotateCcw size={13} />
                            </button>
                        </div>

                        {harness ? (
                            <div className={styles.editorHost}>
                                <MonacoEditorPane
                                    code={code}
                                    language={monacoLanguage}
                                    onChange={tabs.setCode}
                                    onRun={doRun}
                                />
                            </div>
                        ) : (
                            <div className={styles.noHarness}>
                                <p>
                                    This problem has no editor yet — the write-up and the video are
                                    all there is for now.
                                </p>
                                {problem.practiceUrl && (
                                    <a
                                        href={problem.practiceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Practise it on {problem.practicePlatform ?? 'the judge'}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <div
                        className={`${styles.rowGutter} ${vertical.isDragging ? styles.gutterActive : ''}`}
                        aria-label="Resize the console"
                        {...vertical.gutterProps}
                    />

                    <div className={styles.consoleCell}>
                        <ConsolePane
                            samples={problem.samples}
                            result={run.result}
                            error={run.error}
                            totalCases={problem.samples.length}
                            isBusy={run.isBusy}
                            judgeable={problem.judgeable}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ console */

interface ConsolePaneProps {
    samples: { id: string; input: string; expectedOutput: string; explanation?: string | null }[];
    result: DsaRunResult | DsaSubmitResult | null;
    error: string | null;
    totalCases: number;
    isBusy: boolean;
    judgeable: boolean;
}

const ConsolePane: React.FC<ConsolePaneProps> = ({
    samples,
    result,
    error,
    totalCases,
    isBusy,
    judgeable
}) => {
    const [activeCase, setActiveCase] = useState(0);

    const verdict = result?.verdict ?? null;
    const results: DsaCaseResult[] = result?.cases ?? [];

    // Before a run there is nothing to show but the examples themselves.
    const cases: DsaCaseResult[] =
        results.length > 0
            ? results
            : samples.map((s, i) => ({
                  caseNumber: i + 1,
                  sample: true,
                  verdict: 'NOT_RUN' as unknown as DsaCaseResult['verdict'],
                  input: s.input,
                  expectedOutput: s.expectedOutput,
                  actualOutput: null
              }));

    const current = cases[Math.min(activeCase, cases.length - 1)];
    const passed = result?.passedCount ?? 0;
    const compileOutput = result?.compileOutput || result?.stderr || null;
    const stdout = result && 'stdout' in result ? (result.stdout ?? null) : null;
    const message =
        error ??
        (verdict === 'WRONG_ANSWER' && result?.firstFailedCase
            ? `Failed on case ${result.firstFailedCase}.`
            : null);

    const verdictClass =
        verdict === 'ACCEPTED'
            ? styles.verdictOk
            : verdict === 'ENGINE_ERROR'
              ? styles.verdictWarn
              : styles.verdictBad;

    return (
        <>
            <div className={styles.caseTabs}>
                {cases.map((c, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`${styles.caseTab} ${
                            index === activeCase ? styles.caseTabActive : ''
                        } ${c.verdict === 'ACCEPTED' ? styles.casePass : ''} ${
                            c.verdict === 'WRONG_ANSWER' ||
                            c.verdict === 'RUNTIME_ERROR' ||
                            c.verdict === 'TIME_LIMIT'
                                ? styles.caseFail
                                : ''
                        }`}
                        onClick={() => setActiveCase(index)}
                    >
                        {c.verdict === 'ACCEPTED' && <Check size={10} />}
                        {(c.verdict === 'WRONG_ANSWER' || c.verdict === 'RUNTIME_ERROR') && (
                            <X size={10} />
                        )}
                        Case {c.caseNumber}
                    </button>
                ))}
            </div>

            <div className={styles.consoleBody}>
                {!judgeable ? (
                    <p className={styles.consoleHint}>
                        No test cases for this problem yet, so there is nothing to check against.
                        Mark it solved yourself when you are happy with your answer.
                    </p>
                ) : (
                    <>
                        {verdict && (
                            <div className={`${styles.verdictBanner} ${verdictClass}`}>
                                {VERDICT_LABEL[verdict] ?? verdict}
                                <span className={styles.verdictCount}>
                                    {result
                                        ? `${passed} of ${result.totalCount} passed`
                                        : `${totalCases} cases`}
                                </span>
                            </div>
                        )}

                        {message && <p className={styles.consoleHint}>{message}</p>}

                        {current && (
                            <>
                                <div className={styles.ioBlock}>
                                    <span className={styles.ioLabel}>Input</span>
                                    <pre className={styles.ioValue}>{current.input?.trim()}</pre>
                                </div>
                                {current.expectedOutput != null && (
                                    <div className={styles.ioBlock}>
                                        <span className={styles.ioLabel}>Expected</span>
                                        <pre className={styles.ioValue}>
                                            {current.expectedOutput.trim()}
                                        </pre>
                                    </div>
                                )}
                                {current.actualOutput != null && (
                                    <div className={styles.ioBlock}>
                                        <span className={styles.ioLabel}>Your output</span>
                                        <pre
                                            className={`${styles.ioValue} ${
                                                current.verdict !== 'ACCEPTED'
                                                    ? styles.ioValueBad
                                                    : ''
                                            }`}
                                        >
                                            {current.actualOutput.trim() || '(nothing)'}
                                        </pre>
                                    </div>
                                )}
                            </>
                        )}

                        {compileOutput && (
                            <div className={styles.ioBlock}>
                                <span className={styles.ioLabel}>Compiler</span>
                                <pre className={`${styles.ioValue} ${styles.ioValueBad}`}>
                                    {compileOutput}
                                </pre>
                            </div>
                        )}

                        {stdout && (
                            <div className={styles.ioBlock}>
                                <span className={styles.ioLabel}>Raw output</span>
                                <pre className={styles.ioValue}>{stdout}</pre>
                            </div>
                        )}

                        {!verdict && !isBusy && (
                            <p className={styles.consoleHint}>
                                Run to check your answer against the examples, or Submit to run every
                                case. Ctrl/Cmd+Enter runs.
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

/* -------------------------------------------------------------- submissions */

const SubmissionsTab: React.FC<{ problemId: string }> = ({ problemId }) => {
    const [rows, setRows] = useState<
        { id: string; verdict: string; language: string; passedCount: number; totalCount: number; createdAt: string }[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        import('../../api/dsa.api')
            .then(m => m.fetchDsaSubmissions(problemId, 0, 20))
            .then(page => {
                if (!cancelled) setRows(page.content);
            })
            .catch(() => undefined)
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [problemId]);

    if (isLoading) return <p className={styles.consoleHint}>Loading submissions...</p>;
    if (rows.length === 0)
        return <p className={styles.consoleHint}>You have not submitted this one yet.</p>;

    return (
        <div>
            {rows.map(row => (
                <div key={row.id} className={styles.subRow}>
                    <span
                        className={styles.subVerdict}
                        style={{
                            color:
                                row.verdict === 'ACCEPTED'
                                    ? 'var(--color-green-600, #15803d)'
                                    : 'var(--color-red-500, #ef4444)'
                        }}
                    >
                        {VERDICT_LABEL[row.verdict] ?? row.verdict}
                    </span>
                    <span className={styles.subMeta}>{row.language}</span>
                    <span className={styles.subMeta}>
                        {row.passedCount}/{row.totalCount}
                    </span>
                    <span className={styles.subMeta}>
                        {new Date(row.createdAt).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* --------------------------------------------------------------------- note */

const NoteTab: React.FC<{ problemId: string }> = ({ problemId }) => {
    const { content, setContent, isLoading, saveStatus, saveNow } = useNote(
        'DSA_PROBLEM',
        problemId
    );

    return (
        <NotesPanel
            variant="inline"
            title="My note on this problem"
            content={content}
            onChange={setContent}
            onSave={saveNow}
            saveStatus={saveStatus}
            isLoading={isLoading}
        />
    );
};

/* ------------------------------------------------- manual solve (no harness) */

const ManualSolveButton: React.FC<{
    problemId: string;
    solved: boolean;
    onDone: () => void;
}> = ({ problemId, solved, onDone }) => {
    const [isBusy, setIsBusy] = useState(false);

    const toggle = async () => {
        setIsBusy(true);
        try {
            const m = await import('../../api/dsa.api');
            await m.setDsaProblemStatus(problemId, solved ? 'ATTEMPTED' : 'SOLVED');
            onDone();
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <button
            type="button"
            className={solved ? styles.runBtn : styles.submitBtn}
            onClick={toggle}
            disabled={isBusy}
            title="This problem has no test cases, so its status is yours to set"
        >
            {isBusy ? <Loader2 size={14} /> : <Check size={14} />}
            {solved ? 'Solved' : 'Mark solved'}
        </button>
    );
};

export default DsaProblemPage;
