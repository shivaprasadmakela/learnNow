import { useCallback, useEffect, useState } from 'react';
import { fetchDsaEditorial, type DsaApproach } from '../api/dsa.api';
import { fetchDsaEditorialPreview } from '../api/adminDsa.api';

/**
 * The full editorial, fetched only once `enabled` - when the learner has opened the tab and got
 * past the spoiler question.
 *
 * Until then the page holds only the outline that came with the problem. The learner endpoint is
 * cached per problem in `dsa.api`, so opening the tab a second time costs nothing; `preview`
 * reads drafts through the authoring endpoint instead.
 */
export const useDsaEditorial = (problemId: string, enabled: boolean, preview = false) => {
    const [approaches, setApproaches] = useState<DsaApproach[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    /** Bumped by `retry` to run the load again after a failure. */
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setError(null);
        (preview ? fetchDsaEditorialPreview(problemId) : fetchDsaEditorial(problemId))
            .then(editorial => {
                if (!cancelled) setApproaches(editorial.approaches);
            })
            .catch(err => {
                console.error('Could not load the editorial', err);
                if (!cancelled) setError('Could not load the editorial.');
            });
        return () => {
            cancelled = true;
        };
    }, [problemId, enabled, preview, attempt]);

    const retry = useCallback(() => setAttempt(n => n + 1), []);

    return { approaches, error, retry };
};

export default useDsaEditorial;
