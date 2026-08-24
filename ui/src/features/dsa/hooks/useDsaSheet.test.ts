import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDsaSheet } from './useDsaSheet';

const fetchDsaSheet = vi.fn();
const fetchDsaStepProblems = vi.fn();

vi.mock('../api/dsa.api', () => ({
    DEFAULT_SHEET_SLUG: 'sheet',
    fetchDsaSheet: (...a: unknown[]) => fetchDsaSheet(...a),
    fetchDsaStepProblems: (...a: unknown[]) => fetchDsaStepProblems(...a)
}));

const step = (id: string, total = 4, solved = 1) => ({
    id,
    slug: id,
    orderIndex: 1,
    title: `Step ${id}`,
    totalProblems: total,
    solvedProblems: solved
});

const sheet = {
    id: 's1',
    slug: 'sheet',
    title: 'Sheet',
    totalProblems: 8,
    solvedProblems: 2,
    totalByDifficulty: {},
    solvedByDifficulty: {},
    steps: [step('a'), step('b')]
};

const problem = (id: string, status = 'NOT_STARTED') => ({
    id,
    slug: id,
    title: id,
    difficulty: 'EASY',
    estimatedMinutes: 10,
    tags: [],
    hasVideo: false,
    status,
    bookmarked: false
});

const page = <T,>(content: T[], hasNext = false) => ({
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    hasNext
});

describe('useDsaSheet', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchDsaSheet.mockResolvedValue(sheet);
        fetchDsaStepProblems.mockResolvedValue(page([]));
    });

    it('loads the sheet without loading any step problems', async () => {
        // Eighteen steps of forty problems is 700 rows nobody asked to see.
        const { result } = renderHook(() => useDsaSheet());
        await waitFor(() => expect(result.current.sheet).not.toBeNull());

        expect(fetchDsaStepProblems).not.toHaveBeenCalled();
    });

    it('fetches the first page when a step is first opened, and only once', async () => {
        fetchDsaStepProblems.mockResolvedValue(page([problem('p1')], false));
        const { result } = renderHook(() => useDsaSheet());
        await waitFor(() => expect(result.current.sheet).not.toBeNull());

        await act(async () => {
            result.current.ensureProblemsLoaded('a');
        });
        await waitFor(() => expect(result.current.problemsFor('a').rows).toHaveLength(1));

        await act(async () => {
            result.current.ensureProblemsLoaded('a');
        });
        expect(fetchDsaStepProblems).toHaveBeenCalledTimes(1);
    });

    it('appends the next page rather than replacing the first', async () => {
        fetchDsaStepProblems
            .mockResolvedValueOnce(page([problem('p1'), problem('p2')], true))
            .mockResolvedValueOnce(page([problem('p3')], false));

        const { result } = renderHook(() => useDsaSheet());
        await waitFor(() => expect(result.current.sheet).not.toBeNull());

        await act(async () => {
            await result.current.loadMoreProblems('a');
        });
        await act(async () => {
            await result.current.loadMoreProblems('a');
        });

        expect(result.current.problemsFor('a').rows.map(r => r.id)).toEqual(['p1', 'p2', 'p3']);
        expect(result.current.problemsFor('a').hasMore).toBe(false);
        expect(fetchDsaStepProblems).toHaveBeenLastCalledWith('a', 1, 10);
    });

    it('stops asking once the server says there is no more', async () => {
        fetchDsaStepProblems.mockResolvedValue(page([problem('p1')], false));
        const { result } = renderHook(() => useDsaSheet());
        await waitFor(() => expect(result.current.sheet).not.toBeNull());

        await act(async () => {
            await result.current.loadMoreProblems('a');
        });
        await act(async () => {
            await result.current.loadMoreProblems('a');
        });

        expect(fetchDsaStepProblems).toHaveBeenCalledTimes(1);
    });

    it('ticking a problem moves both the step count and the sheet total', async () => {
        fetchDsaStepProblems.mockResolvedValue(page([problem('p1')], false));
        const { result } = renderHook(() => useDsaSheet());
        await waitFor(() => expect(result.current.sheet).not.toBeNull());
        await act(async () => {
            await result.current.loadMoreProblems('a');
        });

        act(() => {
            result.current.applyRowChange('p1', { status: 'SOLVED' });
        });

        expect(result.current.sheet?.solvedProblems).toBe(3);
        expect(result.current.sheet?.steps.find(s => s.id === 'a')?.solvedProblems).toBe(2);
    });

    it('un-ticking moves the counts back down', async () => {
        fetchDsaStepProblems.mockResolvedValue(page([problem('p1', 'SOLVED')], false));
        const { result } = renderHook(() => useDsaSheet());
        await waitFor(() => expect(result.current.sheet).not.toBeNull());
        await act(async () => {
            await result.current.loadMoreProblems('a');
        });

        act(() => {
            result.current.applyRowChange('p1', { status: 'NOT_STARTED' });
        });

        expect(result.current.sheet?.solvedProblems).toBe(1);
    });

    it('starring a problem does not touch the solved counts', async () => {
        fetchDsaStepProblems.mockResolvedValue(page([problem('p1')], false));
        const { result } = renderHook(() => useDsaSheet());
        await waitFor(() => expect(result.current.sheet).not.toBeNull());
        await act(async () => {
            await result.current.loadMoreProblems('a');
        });

        act(() => {
            result.current.applyRowChange('p1', { bookmarked: true });
        });

        expect(result.current.sheet?.solvedProblems).toBe(2);
        expect(result.current.problemsFor('a').rows[0].bookmarked).toBe(true);
    });

    it('surfaces a load failure instead of rendering an empty sheet', async () => {
        fetchDsaSheet.mockRejectedValue(new Error('no sheet'));
        const { result } = renderHook(() => useDsaSheet());

        await waitFor(() => expect(result.current.error).toBe('no sheet'));
        expect(result.current.sheet).toBeNull();
    });
});
