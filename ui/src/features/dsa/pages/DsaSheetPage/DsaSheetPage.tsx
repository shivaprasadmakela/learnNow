import React, { useCallback, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import styles from './DsaSheetPage.module.css';
import { toggleBookmarkApi } from '../../../notes/api/notes.api';
import { SheetProgressHeader } from '../../components/SheetProgressHeader';
import { StepAccordion } from '../../components/StepAccordion';
import { useDsaSheet } from '../../hooks/useDsaSheet';
import { setDsaProblemStatus, type DsaProblemRow } from '../../api/dsa.api';
import { Loader } from '../../../../shared/components/ui/Loader';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

export interface DsaSheetPageProps {
    isLoggedIn: boolean;
    onOpenProblem: (stepSlug: string, problemSlug: string) => void;
    onRequireLogin: () => void;
}

type StatusFilter = 'ALL' | 'TODO' | 'SOLVED' | 'BOOKMARKED';
type DifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';

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

    /**
     * Filtering is client-side over the pages already loaded, which is honest about what it can
     * see: a step the learner has never expanded has nothing to filter. The alternative — pushing
     * filters to the server — would mean the accordion could no longer show per-step counts without
     * a second round of queries, for a sheet whose whole point is that you work through it in order.
     */
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

    /**
     * Which sections are collapsed, keyed by id. Absent means open — sections default to expanded,
     * since the reader has already opened the step to get to them.
     */
    const [openSectionIds, setOpenSectionIds] = useState<Record<string, boolean>>({});
    const toggleSection = useCallback((sectionId: string) => {
        setOpenSectionIds(prev => ({ ...prev, [sectionId]: prev[sectionId] === false }));
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

    /**
     * Bookmarking goes through the shared bookmarks endpoint, the same one the study console uses
     * for topics - so a bookmarked problem turns up in the dashboard's bookmark list beside them
     * rather than in a list of its own.
     */
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

    return (
        <div className={styles.container}>
            <SheetProgressHeader sheet={sheet} />

            <div className={styles.filters}>
                <div className={styles.search}>
                    <Search size={15} className={styles.searchIcon} />
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder="Search loaded problems by title or tag"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        aria-label="Search problems"
                    />
                </div>

                {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as DifficultyFilter[]).map(level => (
                    <button
                        key={level}
                        type="button"
                        className={`${styles.pill} ${difficulty === level ? styles.pillActive : ''}`}
                        onClick={() => setDifficulty(level)}
                        aria-pressed={difficulty === level}
                    >
                        {level === 'ALL' ? 'All levels' : level.charAt(0) + level.slice(1).toLowerCase()}
                    </button>
                ))}

                {isLoggedIn &&
                    (['ALL', 'TODO', 'SOLVED', 'BOOKMARKED'] as StatusFilter[]).map(value => (
                        <button
                            key={value}
                            type="button"
                            className={`${styles.pill} ${status === value ? styles.pillActive : ''}`}
                            onClick={() => setStatus(value)}
                            aria-pressed={status === value}
                        >
                            {value === 'ALL'
                                ? 'Any status'
                                : value === 'TODO'
                                  ? 'Unsolved'
                                  : value === 'SOLVED'
                                    ? 'Solved'
                                    : 'Bookmarked'}
                        </button>
                    ))}

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
        </div>
    );
};

export default DsaSheetPage;
