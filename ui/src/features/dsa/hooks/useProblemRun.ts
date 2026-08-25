import { useCallback, useRef, useState } from 'react';
import {
    runDsaProblem,
    submitDsaProblem,
    type DsaRunResult,
    type DsaSubmitResult,
    type DsaSample
} from '../api/dsa.api';
import { executeJavaScriptLocally } from '../utils/dsaExecutionHelper';

export type RunPhase = 'idle' | 'running' | 'submitting';

export const useProblemRun = (problemId: string | undefined, samples: DsaSample[] = []) => {
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

            const isJsFamily = language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript';

            try {
                const serverRes = await runDsaProblem(problemId, language, code, extraCases);
                setRunResult(serverRes);
            } catch (err: any) {
                // If server harness is missing and language is JS/TS, fallback to local execution against sample cases
                if (isJsFamily && samples && samples.length > 0) {
                    try {
                        const localRes = executeJavaScriptLocally(code, samples);
                        setRunResult(localRes);
                        return;
                    } catch (localErr: any) {
                        setError(localErr?.message || 'Could not execute code locally');
                    }
                } else {
                    setError(err instanceof Error ? err.message : 'Could not run your code');
                }
                setRunResult(null);
            } finally {
                inFlight.current = false;
                setPhase('idle');
            }
        },
        [problemId, samples]
    );

    const submit = useCallback(
        async (language: string, code: string): Promise<DsaSubmitResult | null> => {
            if (!problemId || inFlight.current) return null;
            inFlight.current = true;
            setPhase('submitting');
            setError(null);
            setRunResult(null);

            const isJsFamily = language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript';

            try {
                const result = await submitDsaProblem(problemId, language, code);
                setSubmitResult(result);
                return result;
            } catch (err: any) {
                if (isJsFamily && samples && samples.length > 0) {
                    try {
                        const localRes = executeJavaScriptLocally(code, samples);
                        const fallbackSubmitResult: DsaSubmitResult = {
                            ...localRes,
                            submissionId: `local-${Date.now()}`,
                            newlySolved: localRes.verdict === 'ACCEPTED',
                            pointsAwarded: localRes.verdict === 'ACCEPTED' ? 10 : 0
                        };
                        setSubmitResult(fallbackSubmitResult);
                        return fallbackSubmitResult;
                    } catch (localErr: any) {
                        setError(localErr?.message || 'Could not submit your code');
                    }
                } else {
                    setError(err instanceof Error ? err.message : 'Could not submit your code');
                }
                setSubmitResult(null);
                return null;
            } finally {
                inFlight.current = false;
                setPhase('idle');
            }
        },
        [problemId, samples]
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
