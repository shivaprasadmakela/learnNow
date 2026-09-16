import { useCallback, useRef, useState } from 'react';
import {
    runDsaProblem,
    submitDsaProblem,
    type DsaRunResult,
    type DsaSubmitResult
} from '../api/dsa.api';

export type RunPhase = 'idle' | 'running' | 'submitting';

/**
 * Run and Submit against the server judge.
 *
 * <p>There is deliberately no in-browser fallback. A verdict has to mean the same thing every
 * time, and a client-side evaluator cannot produce one: it never sees the hidden cases, it cannot
 * run the four non-JavaScript languages, and - worst of the three - it turns "the judge was
 * unreachable" into a green ACCEPTED. A failed request surfaces as an error, and the learner knows
 * their answer has not been checked.
 */
export const useProblemRun = (problemId: string | undefined) => {
    const [phase, setPhase] = useState<RunPhase>('idle');
    const [runResult, setRunResult] = useState<DsaRunResult | null>(null);
    const [submitResult, setSubmitResult] = useState<DsaSubmitResult | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            } catch (err: unknown) {
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
            } catch (err: unknown) {
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
