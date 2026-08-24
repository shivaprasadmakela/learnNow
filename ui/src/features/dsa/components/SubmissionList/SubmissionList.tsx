import React, { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import styles from './SubmissionList.module.css';
import { InfiniteScrollSentinel } from '../../../../shared/components/ui/InfiniteScrollSentinel';
import { fetchDsaSubmissions, type DsaSubmission } from '../../api/dsa.api';
import { DEFAULT_PAGE_SIZE } from '../../../../shared/api/pagination';

export interface SubmissionListProps {
    problemId: string;
    isLoggedIn: boolean;
    /** Loads a past submission back into the editor. */
    onRestore: (submission: DsaSubmission) => void;
    /** Bumped by the workspace after a submit, so the list refreshes without a remount. */
    refreshToken?: number;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
    problemId,
    isLoggedIn,
    onRestore,
    refreshToken = 0
}) => {
    const [rows, setRows] = useState<DsaSubmission[]>([]);
    const [page, setPage] = useState(-1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPage = useCallback(
        async (nextPage: number, replace: boolean) => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await fetchDsaSubmissions(problemId, nextPage, DEFAULT_PAGE_SIZE);
                setRows(prev => {
                    if (replace) return result.content;
                    const seen = new Set(prev.map(r => r.id));
                    return [...prev, ...result.content.filter(r => !seen.has(r.id))];
                });
                setPage(nextPage);
                setHasMore(result.hasNext);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not load your submissions');
                setHasMore(false);
            } finally {
                setIsLoading(false);
            }
        },
        [problemId]
    );

    useEffect(() => {
        if (!isLoggedIn) return;
        loadPage(0, true);
    }, [isLoggedIn, loadPage, refreshToken]);

    if (!isLoggedIn) {
        return <p className={styles.state}>Sign in to keep a history of your submissions.</p>;
    }

    if (error) {
        return <p className={styles.state}>{error}</p>;
    }

    if (rows.length === 0 && !isLoading) {
        return <p className={styles.state}>Nothing submitted for this problem yet.</p>;
    }

    return (
        <div className={styles.list}>
            {rows.map(row => {
                const accepted = row.verdict === 'ACCEPTED';
                const tone = accepted
                    ? styles.accepted
                    : row.verdict === 'ENGINE_ERROR'
                      ? styles.neutral
                      : styles.failed;
                return (
                    <div key={row.id} className={styles.row}>
                        <span className={`${styles.verdict} ${tone}`}>
                            {accepted ? <Check size={14} /> : <X size={14} />}
                            {row.verdict.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className={styles.meta}>
                            {row.language} · {row.passedCount}/{row.totalCount}
                            {row.runtimeMs != null ? ` · ${row.runtimeMs} ms` : ''} ·{' '}
                            {new Date(row.createdAt).toLocaleString()}
                        </span>
                        <button
                            type="button"
                            className={styles.restore}
                            onClick={() => onRestore(row)}
                        >
                            Load
                        </button>
                    </div>
                );
            })}

            <InfiniteScrollSentinel
                hasMore={hasMore}
                isLoading={isLoading}
                onLoadMore={() => loadPage(page + 1, false)}
                loadingText="Loading submissions..."
                loadMoreLabel="Load older submissions"
            />
        </div>
    );
};

export default SubmissionList;
