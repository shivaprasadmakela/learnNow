import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../../shared/api';
import { searchDsaSheetProblems, type DsaProblemRow, type DsaSheetSearch } from '../api/dsa.api';

/** Typing pauses this long before a search is sent, so a word costs one request, not one per key. */
const DEBOUNCE_MS = 300;

/**
 * The sheet's search box and filters, answered by one paged request across every step.
 *
 * Inactive - no text, both filters on "all" - it sends nothing and the page shows its steps as
 * usual. It replaced opening all eighteen steps on the first keystroke, which then searched only
 * the first page of each.
 */
export const useDsaSheetSearch = (search: DsaSheetSearch) => {
    const q = search.q?.trim() ?? '';
    const difficulty = search.difficulty ?? 'ALL';
    const status = search.status ?? 'ALL';
    const active = q.length > 0 || difficulty !== 'ALL' || status !== 'ALL';
    const key = active ? JSON.stringify([q, difficulty, status]) : '';

    const [result, setResult] = useState<{
        key: string;
        rows: DsaProblemRow[];
        page: number;
        hasMore: boolean;
        failed: boolean;
    }>({ key: '', rows: [], page: 0, hasMore: false, failed: false });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    /** The search on screen, so a late page of an older search is dropped. */
    const current = useRef(key);

    useEffect(() => {
        current.current = key;
        if (!key) return;
        const timer = setTimeout(() => {
            searchDsaSheetProblems({ q, difficulty, status }, 0, DEFAULT_PAGE_SIZE)
                .then(res => {
                    if (current.current === key) {
                        setResult({ key, rows: res.content, page: 0, hasMore: res.hasNext, failed: false });
                    }
                })
                .catch(err => {
                    console.error('Could not search the sheet', err);
                    if (current.current === key) {
                        setResult({ key, rows: [], page: 0, hasMore: false, failed: true });
                    }
                });
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [key, q, difficulty, status]);

    const loadMore = useCallback(async () => {
        if (!key || result.key !== key || !result.hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const next = result.page + 1;
            const res = await searchDsaSheetProblems({ q, difficulty, status }, next, DEFAULT_PAGE_SIZE);
            if (current.current !== key) return;
            setResult(prev => {
                const seen = new Set(prev.rows.map(r => r.id));
                return {
                    ...prev,
                    rows: [...prev.rows, ...res.content.filter(r => !seen.has(r.id))],
                    page: next,
                    hasMore: res.hasNext
                };
            });
        } catch (err) {
            console.error('Could not load more results', err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [key, result, isLoadingMore, q, difficulty, status]);

    /** Keeps a result row in step with a change the learner made to it. */
    const applyRowChange = useCallback((problemId: string, patch: Partial<DsaProblemRow>) => {
        setResult(prev => ({
            ...prev,
            rows: prev.rows.map(row => (row.id === problemId ? { ...row, ...patch } : row))
        }));
    }, []);

    const settled = result.key === key;
    return {
        active,
        rows: settled ? result.rows : [],
        isLoading: active && !settled,
        failed: settled && result.failed,
        hasMore: settled && result.hasMore,
        isLoadingMore,
        loadMore,
        applyRowChange
    };
};

export default useDsaSheetSearch;
