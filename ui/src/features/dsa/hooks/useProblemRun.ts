import { useCallback, useRef, useState } from 'react';
import {
    runDsaProblem,
    submitDsaProblem,
    type DsaRunResult,
    type DsaSubmitResult
} from '../api/dsa.api';

export type RunPhase = 'idle' | 'running' | 'submitting';

/**
 * Run and Submit, always against the server.
 *
 * Deliberately not built on `useCodeExecution`. That hook branches on language and evaluates
 * JavaScript in the browser with `new Function(...)`, which is right for a sandbox and wrong for a
 * verdict: a JavaScript problem would never reach the server, so there would be no verdict to
 * record and no consistency with the other languages. Only the *panes* are shared with the console,
 * never the execution strategy.
 */
export const useProblemRun = (problemId: string | undefined) => {
    const [phase, setPhase] = useState<RunPhase>('idle');
    const [runResult, setRunResult] = useState<DsaRunResult | null>(null);
    const [submitResult, setSubmitResult] = useState<DsaSubmitResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Guards against a second Ctrl+Enter landing while the first is still in flight. Every run
     * costs metered engine time, so this is a cost control as much as a correctness one.
     */
    const inFlight = useRef(false);

    const run = useCallback(
        async (language: string, code: string, extraCases: string[] = []) => {
            if (!problemId || inFlight.current) return;
            inFlight.current = true;
            setPhase('running');
            setError(null);
            setSubmitResult(null);
            try {
                setRunResult(await runDsaProblem(problemId, language, code, extraCases));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not run your code');
                setRunResult(null);
            } finally {
                inFlight.current = false;
                setPhase('idle');
            }
        },
        [problemId]
    );

    const submit = useCallback(
        async (language: string, code: string): Promise<DsaSubmitResult | null> => {
            if (!problemId || inFlight.current) return null;
            inFlight.current = true;
            setPhase('submitting');
            setError(null);
            setRunResult(null);
            try {
                const result = await submitDsaProblem(problemId, language, code);
                setSubmitResult(result);
                return result;
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not submit your code');
                setSubmitResult(null);
                return null;
            } finally {
                inFlight.current = false;
                setPhase('idle');
            }
        },
        [problemId]
    );

    const clear = useCallback(() => {
        setRunResult(null);
        setSubmitResult(null);
        setError(null);
    }, []);

    /** Whichever of the two produced the results currently on screen. */
    const result: DsaRunResult | DsaSubmitResult | null = submitResult ?? runResult;

    return {
        phase,
        isBusy: phase !== 'idle',
        result,
        runResult,
        submitResult,
        error,
        run,
        submit,
        clear
    };
};

export default useProblemRun;
