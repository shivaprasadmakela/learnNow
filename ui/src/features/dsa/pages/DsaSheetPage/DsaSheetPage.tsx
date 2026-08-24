import React, { useCallback, useMemo, useState } from 'react';
import { Search, Lightbulb, Target, Sparkles, BookOpen } from 'lucide-react';
import styles from './DsaSheetPage.module.css';
import { toggleBookmarkApi } from '../../../notes/api/notes.api';
import { SheetProgressHeader } from '../../components/SheetProgressHeader';
import { StepAccordion } from '../../components/StepAccordion';
import { useDsaSheet } from '../../hooks/useDsaSheet';
import { setDsaProblemStatus, type DsaProblemRow } from '../../api/dsa.api';
import { Loader } from '../../../../shared/components/ui/Loader';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { ProgressRing } from '../../../../shared/components/ui/ProgressRing';
import { SidebarWidget } from '../../../../shared/components/ui/SidebarWidget';

export interface DsaSheetPageProps {
    isLoggedIn: boolean;
    onOpenProblem: (stepSlug: string, problemSlug: string) => void;
    onRequireLogin: () => void;
}

type StatusFilter = 'ALL' | 'TODO' | 'SOLVED' | 'BOOKMARKED';
type DifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';

const DAILY_TIPS = [
    {
        quote: 'Focus on understanding, not just solving.',
        subtext: 'Master the concepts, the solutions will follow.'
    },
    {
        quote: 'First, solve the problem. Then, write the code.',
        subtext: 'Plan your approach with pen and paper before typing.'
    },
    {
        quote: 'Simplicity is prerequisite for reliability.',
        subtext: 'Clean, readable algorithms are easier to debug and optimize.'
    },
    {
        quote: 'Premature optimization is the root of all evil.',
        subtext: 'Get a correct working solution first, then optimize time and space.'
    },
    {
        quote: 'Small daily improvements over time lead to stunning results.',
        subtext: 'Consistency with 1-2 problems daily beats weekend cramming.'
    },
    {
        quote: 'The best error message is the one that never shows up.',
        subtext: 'Always consider edge cases: nulls, empty inputs, and bounds.'
    },
    {
        quote: 'Patterns repeat across problems.',
        subtext: 'Identify underlying archetypes: sliding window, two pointers, BFS/DFS.'
    },
    {
        quote: 'Debugging is twice as hard as writing the code in the first place.',
        subtext: 'Write code as clearly as possible from the start.'
    },
    {
        quote: 'Break complex problems into smaller subproblems.',
        subtext: 'Divide and conquer makes overwhelming challenges manageable.'
    },
    {
        quote: 'Measure twice, code once.',
        subtext: 'Dry run your logic with small sample inputs before submitting.'
    },
    {
        quote: 'Space and time are trade-offs, not absolutes.',
        subtext: 'Explore whether a hash map or sorting gives you the optimal balance.'
    },
    {
        quote: 'Every master was once a beginner who refused to give up.',
        subtext: 'Getting stuck is part of learning. Analyze editorial hints step by step.'
    },
    {
        quote: 'Understand the data structure that best fits the problem.',
        subtext: 'The right structure often makes the algorithmic solution self-evident.'
    },
    {
        quote: 'Write tests for what could break, not just what should work.',
        subtext: 'Test extreme constraints and single-element collections.'
    }
];

export const DsaSheetPage: React.FC<DsaSheetPageProps> = ({
    isLoggedIn,
    onOpenProblem,
    onRequireLogin
}) => {
    const {
        sheet,
        isLoading,
        error,
        problemsFor,
        ensureProblemsLoaded,
        loadMoreProblems,
        applyRowChange
    } = useDsaSheet();

    const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<StatusFilter>('ALL');
    const [difficulty, setDifficulty] = useState<DifficultyFilter>('ALL');

    // Select tip for the 24-hour day across a 14-day (2-week) rotation
    const currentTip = useMemo(() => {
        const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        const index = Math.abs(dayNumber) % DAILY_TIPS.length;
        return DAILY_TIPS[index];
    }, []);

    const toggleStep = useCallback(
        (stepId: string) => {
            setOpenSteps(prev => {
                const next = !prev[stepId];
                if (next) ensureProblemsLoaded(stepId);
                return { ...prev, [stepId]: next };
            });
        },
        [ensureProblemsLoaded]
    );

    const stepSlugById = useMemo(() => {
        const map: Record<string, string> = {};
        sheet?.steps.forEach(step => {
            map[step.id] = step.slug;
        });
        return map;
    }, [sheet]);

    const openProblem = useCallback(
        (stepId: string, problemSlug: string) => {
            onOpenProblem(stepSlugById[stepId] ?? 'step', problemSlug);
        },
        [onOpenProblem, stepSlugById]
    );

    const visible = useCallback(
        (rows: DsaProblemRow[]): DsaProblemRow[] => {
            const q = query.trim().toLowerCase();
            return rows.filter(row => {
                if (difficulty !== 'ALL' && row.difficulty !== difficulty) return false;
                if (status === 'SOLVED' && row.status !== 'SOLVED') return false;
                if (status === 'TODO' && row.status === 'SOLVED') return false;
                if (status === 'BOOKMARKED' && !row.bookmarked) return false;
                if (!q) return true;
                return (
                    row.title.toLowerCase().includes(q) ||
                    row.tags.some(tag => tag.toLowerCase().includes(q))
                );
            });
        },
        [query, status, difficulty]
    );

    const [openSectionIds, setOpenSectionIds] = useState<Record<string, boolean>>({});
    const toggleSection = useCallback((sectionId: string) => {
        setOpenSectionIds(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    }, []);

    const handleToggleSolved = useCallback(
        async (problem: DsaProblemRow) => {
            if (!isLoggedIn) {
                onRequireLogin();
                return;
            }
            const next = problem.status === 'SOLVED' ? 'NOT_STARTED' : 'SOLVED';
            applyRowChange(problem.id, { status: next });
            try {
                await setDsaProblemStatus(problem.id, next);
            } catch (err) {
                console.error('Could not save that', err);
                applyRowChange(problem.id, { status: problem.status });
            }
        },
        [isLoggedIn, onRequireLogin, applyRowChange]
    );

    const handleToggleBookmark = useCallback(
        async (problem: DsaProblemRow) => {
            if (!isLoggedIn) {
                onRequireLogin();
                return;
            }
            const next = !problem.bookmarked;
            applyRowChange(problem.id, { bookmarked: next });
            try {
                await toggleBookmarkApi(problem.id, 'DSA_PROBLEM');
            } catch (err) {
                console.error('Could not save that', err);
                applyRowChange(problem.id, { bookmarked: problem.bookmarked });
            }
        },
        [isLoggedIn, onRequireLogin, applyRowChange]
    );

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.state}>
                    <Loader variant="inline" text="Loading the sheet..." showColdStartFunnyMessages />
                </div>
            </div>
        );
    }

    if (error || !sheet) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error ?? 'That sheet could not be loaded.'}
                </div>
            </div>
        );
    }

    if (sheet.steps.length === 0) {
        return (
            <div className={styles.container}>
                <SheetProgressHeader sheet={sheet} />
                <EmptyState
                    icon={BookOpen}
                    title="Nothing published yet"
                    description="The first steps of this sheet are being written. Check back shortly."
                />
            </div>
        );
    }

    const solvedCount = sheet.solvedProblems;
    const totalCount = sheet.totalProblems;
    const remainingCount = Math.max(0, totalCount - solvedCount);
    const solvedPct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
    const remainingPct = 100 - solvedPct;

    const weeklyGoalTarget = 20;
    const weeklyGoalProgress = Math.min(weeklyGoalTarget, solvedCount);
    const weeklyGoalPct = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalTarget) * 100));

    return (
        <div className={styles.container}>
            <div className={styles.pageLayout}>
                {/* Main Content Column */}
                <div className={styles.mainColumn}>
                    <SheetProgressHeader sheet={sheet} />

                    <div className={styles.filters}>
                        <div className={styles.search}>
                            <Search size={15} className={styles.searchIcon} />
                            <input
                                type="search"
                                className={styles.searchInput}
                                placeholder="Search problems by title or tags..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                aria-label="Search problems"
                            />
                        </div>

                        <div className={styles.difficultyFilters}>
                            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as DifficultyFilter[]).map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    className={`${styles.pill} ${difficulty === level ? styles.pillActive : ''}`}
                                    onClick={() => setDifficulty(level)}
                                    aria-pressed={difficulty === level}
                                >
                                    {level === 'ALL' ? 'All Levels' : level.charAt(0) + level.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        {isLoggedIn && (
                            <div className={styles.statusFilters}>
                                {(['ALL', 'TODO', 'SOLVED', 'BOOKMARKED'] as StatusFilter[]).map(value => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`${styles.pill} ${status === value ? styles.pillActive : ''}`}
                                        onClick={() => setStatus(value)}
                                        aria-pressed={status === value}
                                    >
                                        {value === 'ALL'
                                            ? 'All Status'
                                            : value === 'TODO'
                                              ? 'Unsolved'
                                              : value === 'SOLVED'
                                                ? 'Solved'
                                                : 'Bookmarked'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.steps}>
                        {sheet.steps.map(step => {
                            const state = problemsFor(step.id);
                            return (
                                <StepAccordion
                                    key={step.id}
                                    step={step}
                                    isOpen={Boolean(openSteps[step.id])}
                                    onToggle={() => toggleStep(step.id)}
                                    problems={visible(state.rows)}
                                    hasMore={state.hasMore}
                                    isLoading={state.isLoading}
                                    onLoadMore={() => loadMoreProblems(step.id)}
                                    onOpenProblem={slug => openProblem(step.id, slug)}
                                    onToggleSolved={handleToggleSolved}
                                    onToggleBookmark={handleToggleBookmark}
                                    openSectionIds={openSectionIds}
                                    onToggleSection={toggleSection}
                                    canTrack={isLoggedIn}
                                />
                            );
                        })}
                    </div>

                    {/* Motivational Footer Banner with learnNow Logo Theme Gradient */}
                    <div className={styles.motivationalBanner}>
                        <Sparkles size={18} className={styles.bannerIcon} />
                        <span className={styles.bannerText}>
                            Every problem you solve makes you better. <strong>Keep going! 💪</strong>
                        </span>
                    </div>
                </div>

                {/* Right Sidebar Column */}
                <div className={styles.sideColumn}>
                    {/* Overall Progress Card */}
                    <SidebarWidget title="Overall Progress">
                        <div className={styles.progressRingSection}>
                            <ProgressRing
                                percentage={solvedPct}
                                size={110}
                                strokeWidth={9}
                                label={`${solvedPct}%`}
                                sublabel="Solved"
                                primaryColor="var(--tech-blue)"
                            />
                            <div className={styles.progressLegend}>
                                <div className={styles.legendRow}>
                                    <span className={`${styles.legendDot} ${styles.legendDotSolved}`} />
                                    <span className={styles.legendLabel}>Solved</span>
                                    <span className={styles.legendValue}>{solvedCount} ({solvedPct}%)</span>
                                </div>
                                <div className={styles.legendRow}>
                                    <span className={`${styles.legendDot} ${styles.legendDotRemaining}`} />
                                    <span className={styles.legendLabel}>Remaining</span>
                                    <span className={styles.legendValue}>{remainingCount} ({remainingPct}%)</span>
                                </div>
                            </div>
                        </div>
                    </SidebarWidget>

                    {/* Weekly Goal Card */}
                    <SidebarWidget title="Weekly Goal">
                        <div className={styles.goalSection}>
                            <div className={styles.goalHeader}>
                                <span className={styles.goalCount}>{weeklyGoalProgress} / {weeklyGoalTarget} solved</span>
                            </div>
                            <div className={styles.goalProgressBarTrack}>
                                <div
                                    className={styles.goalProgressBarFill}
                                    style={{ width: `${weeklyGoalPct}%` }}
                                />
                            </div>
                            <div className={styles.goalSubtext}>
                                <Target size={14} className={styles.goalIcon} />
                                <span>Solve {weeklyGoalTarget} problems this week</span>
                            </div>
                        </div>
                    </SidebarWidget>

                    {/* Tip of the Day Card (Bottom Last Widget with 14-day 24h rotation) */}
                    <SidebarWidget
                        title="Tip of the Day"
                        icon={<Lightbulb size={16} className={styles.tipIcon} />}
                    >
                        <div className={styles.tipSection}>
                            <p className={styles.tipQuote}>
                                &ldquo;{currentTip.quote}&rdquo;
                            </p>
                            <p className={styles.tipSubtext}>
                                {currentTip.subtext}
                            </p>
                        </div>
                    </SidebarWidget>
                </div>
            </div>
        </div>
    );
};

export default DsaSheetPage;
