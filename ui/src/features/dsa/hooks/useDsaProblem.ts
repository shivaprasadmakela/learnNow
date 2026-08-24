import { useCallback, useEffect, useState } from 'react';
import {
    fetchDsaProblem,
    setDsaProblemStatus,
    type DsaProblemDetail,
    type DsaProgressStatus
} from '../api/dsa.api';

/** One problem, plus optimistic writes to the learner's own progress on it. */
export const useDsaProblem = (slug: string | undefined) => {
    const [problem, setProblem] = useState<DsaProblemDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!slug) return;
        setIsLoading(true);
        setError(null);
        try {
            setProblem(await fetchDsaProblem(slug));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load this problem');
            setProblem(null);
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    /**
     * Applies a progress change locally first and rolls back if the server refuses.
     *
     * Toggling solved or starred should feel instant; leaving the control in its old state until a
     * round trip completes makes the page feel broken on a slow connection.
     */
    const patchProgress = useCallback(
        async (
            patch: Partial<DsaProblemDetail['progress']>,
            request: () => Promise<DsaProblemDetail['progress']>
        ) => {
            const previous = problem?.progress;
            if (!previous) return;

            setProblem(prev => (prev ? { ...prev, progress: { ...prev.progress, ...patch } } : prev));
            try {
                const fresh = await request();
                setProblem(prev => (prev ? { ...prev, progress: fresh } : prev));
            } catch (err) {
                console.error('Could not save your progress', err);
                setProblem(prev => (prev ? { ...prev, progress: previous } : prev));
            }
        },
        [problem?.progress]
    );

    const markStatus = useCallback(
        (status: DsaProgressStatus) => {
            if (!problem) return Promise.resolve();
            return patchProgress({ status }, () => setDsaProblemStatus(problem.id, status));
        },
        [problem, patchProgress]
    );

    /** Called after an accepted submission, so the header reflects it without a refetch. */
    const markSolvedLocally = useCallback(() => {
        setProblem(prev =>
            prev ? { ...prev, progress: { ...prev.progress, status: 'SOLVED' } } : prev
        );
    }, []);

    return {
        problem,
        isLoading,
        error,
        markStatus,
        markSolvedLocally,
        reload: load
    };
};

export default useDsaProblem;
