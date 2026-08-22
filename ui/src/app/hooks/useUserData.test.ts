import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useUserData } from './useUserData';

const fetchPathsPage = vi.fn();
const fetchPublicPathsPage = vi.fn();
const fetchTopicsByPathPage = vi.fn();

vi.mock('../../shared/api', () => ({
    DEFAULT_PAGE_SIZE: 10,
    fetchPathsPage: (...a: unknown[]) => fetchPathsPage(...a),
    fetchPublicPathsPage: (...a: unknown[]) => fetchPublicPathsPage(...a),
    fetchTopicsByPathPage: (...a: unknown[]) => fetchTopicsByPathPage(...a)
}));

const page = <T,>(content: T[], hasNext = false) => ({
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    hasNext
});

const path = (id: number, topicCount = 0, topics: unknown[] = []) => ({
    id,
    title: `Path ${id}`,
    description: '',
    category: 'Backend',
    managedBy: 'learnNow',
    progressPercentage: 0,
    topicCount,
    topics
});

/**
 * The study console renders a single topic via its own endpoint and never shows the path list,
 * so it must not pull every path and all their topics. That request was ~14 s against a database
 * on another continent, and it delayed the requests the screen actually needed.
 */
describe('useUserData path fetching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchPathsPage.mockResolvedValue(page([]));
        fetchPublicPathsPage.mockResolvedValue(page([]));
        fetchTopicsByPathPage.mockResolvedValue(page([]));
    });
    afterEach(() => vi.clearAllMocks());

    const render = (view: string) =>
        renderHook(() => useUserData(true, view, false));

    it.each(['HOME', 'PATHS', 'TOPICS'])('fetches paths on the %s view', async (view) => {
        render(view);
        await waitFor(() => expect(fetchPathsPage).toHaveBeenCalledTimes(1));
    });

    it('asks for the first page only', async () => {
        render('PATHS');
        await waitFor(() => expect(fetchPathsPage).toHaveBeenCalledTimes(1));
        expect(fetchPathsPage).toHaveBeenCalledWith(0, 10, false);
    });

    it('does NOT fetch paths in the study console', async () => {
        render('STUDY');
        // Give any effect a chance to fire before asserting the negative.
        await new Promise((r) => setTimeout(r, 50));
        expect(fetchPathsPage).not.toHaveBeenCalled();
        expect(fetchPublicPathsPage).not.toHaveBeenCalled();
    });

    it('does not refetch on re-render once loaded', async () => {
        const { rerender } = render('PATHS');
        await waitFor(() => expect(fetchPathsPage).toHaveBeenCalledTimes(1));
        for (let i = 0; i < 5; i++) rerender();
        expect(fetchPathsPage).toHaveBeenCalledTimes(1);
    });

    it('markPathsStale defers the refetch instead of doing it immediately', async () => {
        const { result } = render('PATHS');
        await waitFor(() => expect(fetchPathsPage).toHaveBeenCalledTimes(1));

        result.current.markPathsStale();
        // The point of the change: marking stale costs no request here.
        await new Promise((r) => setTimeout(r, 50));
        expect(fetchPathsPage).toHaveBeenCalledTimes(1);
    });
});

describe('useUserData pagination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchTopicsByPathPage.mockResolvedValue(page([]));
    });
    afterEach(() => vi.clearAllMocks());

    it('appends the next page of paths rather than replacing the first', async () => {
        fetchPathsPage
            .mockResolvedValueOnce(page([path(1), path(2)], true))
            .mockResolvedValueOnce(page([path(3)], false));

        const { result } = renderHook(() => useUserData(true, 'PATHS', false));
        await waitFor(() => expect(result.current.courses).toHaveLength(2));
        expect(result.current.hasMorePaths).toBe(true);

        await act(async () => {
            await result.current.loadMorePaths();
        });

        expect(result.current.courses.map(c => c.id)).toEqual([1, 2, 3]);
        expect(result.current.hasMorePaths).toBe(false);
        expect(fetchPathsPage).toHaveBeenLastCalledWith(1, 10);
    });

    it('stops asking for paths once the server reports no more', async () => {
        fetchPathsPage.mockResolvedValue(page([path(1)], false));

        const { result } = renderHook(() => useUserData(true, 'PATHS', false));
        await waitFor(() => expect(result.current.courses).toHaveLength(1));

        await act(async () => {
            await result.current.loadMorePaths();
        });
        expect(fetchPathsPage).toHaveBeenCalledTimes(1);
    });

    it('knows more topics remain when a path embeds fewer than its total', async () => {
        fetchPathsPage.mockResolvedValue(
            page([path(1, 25, [{ id: 't1', title: 'One' }])], false)
        );

        const { result } = renderHook(() => useUserData(true, 'PATHS', false));
        await waitFor(() => expect(result.current.courses).toHaveLength(1));

        expect(result.current.getTopicPaging(1).hasNext).toBe(true);
    });

    it('appends a further page of topics onto the path it belongs to', async () => {
        fetchPathsPage.mockResolvedValue(
            page([path(1, 2, [{ id: 't1', title: 'One' }])], false)
        );
        fetchTopicsByPathPage.mockResolvedValue(page([{ id: 't2', title: 'Two' }], false));

        const { result } = renderHook(() => useUserData(true, 'PATHS', false));
        await waitFor(() => expect(result.current.courses).toHaveLength(1));

        await act(async () => {
            await result.current.loadMoreTopicsForPath(1);
        });

        expect(result.current.courses[0].topics?.map(t => t.id)).toEqual(['t1', 't2']);
        expect(fetchTopicsByPathPage).toHaveBeenCalledWith(1, 1, 10);
        expect(result.current.getTopicPaging(1).hasNext).toBe(false);
    });
});
