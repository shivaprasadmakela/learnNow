import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserData } from './useUserData';

const fetchPaths = vi.fn();
const fetchPublicPaths = vi.fn();

vi.mock('../../shared/api', () => ({
    fetchPaths: (...a: unknown[]) => fetchPaths(...a),
    fetchPublicPaths: (...a: unknown[]) => fetchPublicPaths(...a),
    fetchTopicsByPath: vi.fn().mockResolvedValue([])
}));

/**
 * The study console renders a single topic via its own endpoint and never shows the path list,
 * so it must not pull every path and all their topics. That request was ~14 s against a database
 * on another continent, and it delayed the requests the screen actually needed.
 */
describe('useUserData path fetching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchPaths.mockResolvedValue([]);
        fetchPublicPaths.mockResolvedValue([]);
    });
    afterEach(() => vi.clearAllMocks());

    const render = (view: string) =>
        renderHook(() => useUserData(true, view, false));

    it.each(['HOME', 'PATHS', 'TOPICS'])('fetches paths on the %s view', async (view) => {
        render(view);
        await waitFor(() => expect(fetchPaths).toHaveBeenCalledTimes(1));
    });

    it('does NOT fetch paths in the study console', async () => {
        render('STUDY');
        // Give any effect a chance to fire before asserting the negative.
        await new Promise((r) => setTimeout(r, 50));
        expect(fetchPaths).not.toHaveBeenCalled();
        expect(fetchPublicPaths).not.toHaveBeenCalled();
    });

    it('does not refetch on re-render once loaded', async () => {
        const { rerender } = render('PATHS');
        await waitFor(() => expect(fetchPaths).toHaveBeenCalledTimes(1));
        for (let i = 0; i < 5; i++) rerender();
        expect(fetchPaths).toHaveBeenCalledTimes(1);
    });

    it('markPathsStale defers the refetch instead of doing it immediately', async () => {
        const { result } = render('PATHS');
        await waitFor(() => expect(fetchPaths).toHaveBeenCalledTimes(1));

        result.current.markPathsStale();
        // The point of the change: marking stale costs no request here.
        await new Promise((r) => setTimeout(r, 50));
        expect(fetchPaths).toHaveBeenCalledTimes(1);
    });
});
