import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProblemRun } from './useProblemRun';

const runDsaProblem = vi.fn();
const submitDsaProblem = vi.fn();

vi.mock('../api/dsa.api', () => ({
    runDsaProblem: (...a: unknown[]) => runDsaProblem(...a),
    submitDsaProblem: (...a: unknown[]) => submitDsaProblem(...a)
}));

const accepted = {
    verdict: 'ACCEPTED',
    passedCount: 3,
    totalCount: 3,
    firstFailedCase: null,
    cases: []
};

describe('useProblemRun', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        runDsaProblem.mockResolvedValue(accepted);
        submitDsaProblem.mockResolvedValue({ ...accepted, submissionId: 's1', newlySolved: true, pointsAwarded: 15 });
    });

    it('sends the language, code and any ad-hoc cases', async () => {
        const { result } = renderHook(() => useProblemRun('p1'));

        await act(async () => {
            await result.current.run('cpp', 'class Solution {};', ['5\n']);
        });

        expect(runDsaProblem).toHaveBeenCalledWith('p1', 'cpp', 'class Solution {};', ['5\n']);
        expect(result.current.result?.verdict).toBe('ACCEPTED');
    });

    it('ignores a second run while the first is still in flight', async () => {
        // Every run costs metered engine time, so a double Ctrl+Enter must not buy two of them.
        let release: (value: unknown) => void = () => {};
        runDsaProblem.mockImplementation(
            () => new Promise(resolve => {
                release = resolve;
            })
        );

        const { result } = renderHook(() => useProblemRun('p1'));

        act(() => {
            result.current.run('cpp', 'a');
        });
        await waitFor(() => expect(result.current.isBusy).toBe(true));

        act(() => {
            result.current.run('cpp', 'b');
        });

        await act(async () => {
            release(accepted);
        });

        expect(runDsaProblem).toHaveBeenCalledTimes(1);
    });

    it('does nothing at all without a problem id', async () => {
        const { result } = renderHook(() => useProblemRun(undefined));

        await act(async () => {
            await result.current.run('cpp', 'a');
        });

        expect(runDsaProblem).not.toHaveBeenCalled();
    });

    it('surfaces a failure as an error rather than a verdict', async () => {
        runDsaProblem.mockRejectedValue(new Error('engine is down'));
        const { result } = renderHook(() => useProblemRun('p1'));

        await act(async () => {
            await result.current.run('cpp', 'a');
        });

        expect(result.current.error).toBe('engine is down');
        expect(result.current.result).toBeNull();
        // A failed request must not leave the buttons disabled forever.
        expect(result.current.isBusy).toBe(false);
    });

    it('returns the submit outcome so the caller can decide whether to celebrate', async () => {
        const { result } = renderHook(() => useProblemRun('p1'));

        const seen: Array<{ newlySolved: boolean; pointsAwarded: number } | null> = [];
        await act(async () => {
            seen.push(await result.current.submit('cpp', 'a'));
        });

        // Returned to the caller, not only stored: the page needs it to decide whether to
        // celebrate, and re-submitting an accepted solution must not fire the confetti twice.
        expect(seen[0]?.newlySolved).toBe(true);
        expect(seen[0]?.pointsAwarded).toBe(15);
        expect(result.current.submitResult?.newlySolved).toBe(true);
    });

    it('a submit replaces a previous run result rather than showing both', async () => {
        const { result } = renderHook(() => useProblemRun('p1'));

        await act(async () => {
            await result.current.run('cpp', 'a');
        });
        expect(result.current.runResult).not.toBeNull();

        await act(async () => {
            await result.current.submit('cpp', 'a');
        });

        expect(result.current.runResult).toBeNull();
        expect(result.current.submitResult).not.toBeNull();
    });
});
