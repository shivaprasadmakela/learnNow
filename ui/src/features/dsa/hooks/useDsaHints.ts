import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDsaHint, type DsaHint } from '../api/dsa.api';
import { fetchDsaHintPreview } from '../api/adminDsa.api';

/**
 * A problem's hints, fetched one at a time as the learner reveals them.
 *
 * The problem payload carries only how many hints there are. Each click on "show a hint" asks for
 * exactly the next one, so a learner who needed only the first nudge is never sent the rest.
 * `preview` reads drafts through the authoring endpoint, as `useDsaProblem` does.
 */
export const useDsaHints = (problemId: string | undefined, hintCount: number, preview = false) => {
    const [hints, setHints] = useState<DsaHint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** The problem the revealed hints belong to, so a late answer for another one is dropped. */
    const currentProblem = useRef(problemId);

    useEffect(() => {
        currentProblem.current = problemId;
        setHints([]);
        setError(null);
        setIsLoading(false);
    }, [problemId]);

    const revealNext = useCallback(async () => {
        if (!problemId || isLoading || hints.length >= hintCount) return;
        const n = hints.length + 1;
        setIsLoading(true);
        setError(null);
        try {
            const hint = preview
                ? await fetchDsaHintPreview(problemId, n)
                : await fetchDsaHint(problemId, n);
            if (currentProblem.current !== problemId) return;
            setHints(prev => (prev.length === n - 1 ? [...prev, hint] : prev));
        } catch (err) {
            console.error('Could not load that hint', err);
            if (currentProblem.current === problemId) setError('Could not load that hint.');
        } finally {
            if (currentProblem.current === problemId) setIsLoading(false);
        }
    }, [problemId, isLoading, hints.length, hintCount, preview]);

    return {
        /** The hints revealed so far, in order. */
        hints,
        revealNext,
        isLoading,
        error,
        hasMore: hints.length < hintCount
    };
};

export default useDsaHints;
