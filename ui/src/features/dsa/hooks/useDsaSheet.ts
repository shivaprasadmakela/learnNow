import { useCallback, useEffect, useRef, useState } from 'react';
import {
    DEFAULT_SHEET_SLUG,
    fetchDsaSheet,
    fetchDsaStepProblems,
    type DsaProblemRow,
    type DsaSheetDetail
} from '../api/dsa.api';
import { DEFAULT_PAGE_SIZE } from '../../../shared/api/pagination';

interface StepProblems {
    rows: DsaProblemRow[];
    page: number;
    hasMore: boolean;
    isLoading: boolean;
}

const emptyStep: StepProblems = { rows: [], page: -1, hasMore: true, isLoading: false };

/**
 * The sheet, plus one lazily-loaded page of problems per opened step.
 *
 * Problems are fetched when a step is first expanded, not with the sheet: eighteen steps of forty
 * problems is seven hundred rows nobody has asked to see. Each step then pages independently as it
 * scrolls.
 */
export const useDsaSheet = (sheetSlug: string = DEFAULT_SHEET_SLUG) => {
    const [sheet, setSheet] = useState<DsaSheetDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [problemsByStep, setProblemsByStep] = useState<Record<string, StepProblems>>({});

    /**
     * Mirrors `problemsByStep`. The loader reads the cursor while it runs, and re-rendering on each
     * appended page must not hand a stale cursor to a request already in flight.
     */
    const stepsRef = useRef<Record<string, StepProblems>>({});

    const writeStep = useCallback((stepId: string, next: StepProblems) => {
        stepsRef.current = { ...stepsRef.current, [stepId]: next };
        setProblemsByStep(stepsRef.current);
    }, []);

    const loadSheet = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setSheet(await fetchDsaSheet(sheetSlug));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the sheet');
        } finally {
            setIsLoading(false);
        }
    }, [sheetSlug]);

    useEffect(() => {
        loadSheet();
    }, [loadSheet]);

    const loadMoreProblems = useCallback(
        async (stepId: string) => {
            const current = stepsRef.current[stepId] ?? emptyStep;
            if (current.isLoading || !current.hasMore) return;

            const nextPage = current.page + 1;
            writeStep(stepId, { ...current, isLoading: true });
            try {
                const result = await fetchDsaStepProblems(stepId, nextPage, DEFAULT_PAGE_SIZE);
                const seen = new Set(current.rows.map(r => r.id));
                writeStep(stepId, {
                    rows: [...current.rows, ...result.content.filter(r => !seen.has(r.id))],
                    page: nextPage,
                    hasMore: result.hasNext,
                    isLoading: false
                });
            } catch (err) {
                console.error('Could not load problems for step', err);
                writeStep(stepId, { ...current, hasMore: false, isLoading: false });
            }
        },
        [writeStep]
    );

    /** Called when a step is expanded. Fetches the first page only if nothing is loaded yet. */
    const ensureProblemsLoaded = useCallback(
        (stepId: string) => {
            const current = stepsRef.current[stepId];
            if (!current || current.page < 0) {
                loadMoreProblems(stepId);
            }
        },
        [loadMoreProblems]
    );

    const problemsFor = useCallback(
        (stepId: string): StepProblems => problemsByStep[stepId] ?? emptyStep,
        [problemsByStep]
    );

    /**
     * Applies a status or revision change to whatever rows are loaded, without refetching.
     *
     * Ticking a checkbox should feel instant. The sheet-level counts are corrected by the same
     * call so the header does not lag behind the row the learner just clicked.
     */
    const applyRowChange = useCallback(
        (problemId: string, patch: Partial<DsaProblemRow>) => {
            let becameSolved = false;
            let becameUnsolved = false;

            stepsRef.current = Object.fromEntries(
                Object.entries(stepsRef.current).map(([stepId, step]) => [
                    stepId,
                    {
                        ...step,
                        rows: step.rows.map(row => {
                            if (row.id !== problemId) return row;
                            if (patch.status === 'SOLVED' && row.status !== 'SOLVED') {
                                becameSolved = true;
                            }
                            if (
                                patch.status &&
                                patch.status !== 'SOLVED' &&
                                row.status === 'SOLVED'
                            ) {
                                becameUnsolved = true;
                            }
                            return { ...row, ...patch };
                        })
                    }
                ])
            );
            setProblemsByStep(stepsRef.current);

            if (!becameSolved && !becameUnsolved) return;
            const delta = becameSolved ? 1 : -1;

            setSheet(prev => {
                if (!prev) return prev;
                const stepId = Object.entries(stepsRef.current).find(([, step]) =>
                    step.rows.some(r => r.id === problemId)
                )?.[0];

                return {
                    ...prev,
                    solvedProblems: Math.max(0, prev.solvedProblems + delta),
                    steps: prev.steps.map(step =>
                        step.id === stepId
                            ? {
                                  ...step,
                                  solvedProblems: Math.max(0, step.solvedProblems + delta)
                              }
                            : step
                    )
                };
            });
        },
        []
    );

    return {
        sheet,
        isLoading,
        error,
        problemsFor,
        ensureProblemsLoaded,
        loadMoreProblems,
        applyRowChange,
        reload: loadSheet
    };
};

export default useDsaSheet;
