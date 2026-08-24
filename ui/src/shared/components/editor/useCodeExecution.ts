import { useState, useCallback } from 'react';
import { executeCodeApi } from '../../../shared/api/compiler.api';

export interface ConsoleLogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
    timestamp: string;
}

/** Normalize any value to a printable string, handling null / undefined / objects */
function formatArg(a: unknown): string {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a === 'object') {
        try {
            return JSON.stringify(a, null, 2);
        } catch {
            return String(a);
        }
    }
    return String(a);
}

export function useCodeExecution() {
    const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
    const [htmlPreview, setHtmlPreview] = useState<string>('');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

    const runCode = useCallback(async (code: string, languageId: string, stdin: string = '') => {
        setIsRunning(true);
        setLogs([]);
        setHtmlPreview('');
        setExecutionTimeMs(null);

        const startTime = performance.now();
        const timestamp = new Date().toLocaleTimeString();
        const capturedLogs: ConsoleLogEntry[] = [];

        try {
            const lang = languageId.toLowerCase();

            if (lang === 'html' || lang === 'xml') {
                setHtmlPreview(code);
                capturedLogs.push({ type: 'info', message: 'Rendered live HTML preview in output pane.', timestamp });

            } else if (lang === 'javascript' || lang === 'js') {
                const customConsole = {
                    log: (...args: unknown[]) =>
                        capturedLogs.push({ type: 'log', message: args.map(formatArg).join(' '), timestamp }),
                    error: (...args: unknown[]) =>
                        capturedLogs.push({ type: 'error', message: args.map(formatArg).join(' '), timestamp }),
                    warn: (...args: unknown[]) =>
                        capturedLogs.push({ type: 'warn', message: args.map(formatArg).join(' '), timestamp })
                };

                if (stdin.trim()) {
                    capturedLogs.push({ type: 'info', message: `[stdin input]: ${stdin.trim()}`, timestamp });
                }

                // eslint-disable-next-line no-new-func
                const runnerFn = new Function('console', 'stdin', code);
                runnerFn(customConsole, stdin);

                const hasOutput = capturedLogs.some(l => l.type !== 'info');
                if (!hasOutput) {
                    capturedLogs.push({ type: 'info', message: 'Program executed with zero console output.', timestamp });
                }

                setExecutionTimeMs(Math.round(performance.now() - startTime));

            } else {
                capturedLogs.push({ type: 'info', message: `Executing ${languageId.toUpperCase()} via cloud executor...`, timestamp });
                if (stdin.trim()) {
                    capturedLogs.push({ type: 'info', message: `[stdin]: ${stdin.trim()}`, timestamp });
                }

                const result = await executeCodeApi({ language: languageId, code, stdin });

                setExecutionTimeMs(
                    result.timeSeconds != null
                        ? Math.round(result.timeSeconds * 1000)
                        : Math.round(performance.now() - startTime)
                );

                if (result.compileOutput && result.compileOutput.trim()) {
                    capturedLogs.push({ type: 'error', message: `[Compilation Error]\n${result.compileOutput.trim()}`, timestamp });
                }

                if (result.stderr && result.stderr.trim()) {
                    capturedLogs.push({ type: 'error', message: result.stderr.trim(), timestamp });
                }

                if (result.stdout && result.stdout.trim()) {
                    capturedLogs.push({ type: 'log', message: result.stdout.trimEnd(), timestamp });
                } else if (!result.stderr && !result.compileOutput) {
                    capturedLogs.push({ type: 'info', message: 'Process finished with exit code 0 (no output)', timestamp });
                }
            }

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            capturedLogs.push({ type: 'error', message: `Execution Error: ${msg}`, timestamp });
            setExecutionTimeMs(Math.round(performance.now() - startTime));
        } finally {
            setLogs(capturedLogs);
            setIsRunning(false);
        }
    }, []);

    const clearConsole = useCallback(() => {
        setLogs([]);
        setHtmlPreview('');
        setExecutionTimeMs(null);
    }, []);

    return { logs, htmlPreview, isRunning, executionTimeMs, runCode, clearConsole };
}
