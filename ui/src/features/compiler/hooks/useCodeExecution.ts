import { useState, useCallback } from 'react';
import { executeCodeApi } from '../../../shared/api/compiler.api';

export interface ConsoleLogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
    timestamp: string;
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
        const startTime = performance.now();
        const timestamp = new Date().toLocaleTimeString();
        const capturedLogs: ConsoleLogEntry[] = [];

        try {
            const lang = languageId.toLowerCase();

            if (lang === 'html' || lang === 'xml') {
                setHtmlPreview(code);
                capturedLogs.push({ type: 'info', message: 'Rendered live HTML preview in output pane.', timestamp });
            } else if (lang === 'javascript' || lang === 'js') {
                const formatArg = (a: unknown) => {
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
                };

                const customConsole = {
                    log: (...args: unknown[]) => {
                        capturedLogs.push({
                            type: 'log',
                            message: args.map(formatArg).join(' '),
                            timestamp
                        });
                    },
                    error: (...args: unknown[]) => {
                        capturedLogs.push({
                            type: 'error',
                            message: args.map(formatArg).join(' '),
                            timestamp
                        });
                    },
                    warn: (...args: unknown[]) => {
                        capturedLogs.push({
                            type: 'warn',
                            message: args.map(formatArg).join(' '),
                            timestamp
                        });
                    }
                };

                if (stdin.trim()) {
                    capturedLogs.push({ type: 'info', message: `[stdin input]: ${stdin.trim()}`, timestamp });
                }

                const runnerFn = new Function('console', 'stdin', code);
                runnerFn(customConsole, stdin);

                if (capturedLogs.length === 0) {
                    capturedLogs.push({ type: 'info', message: 'Program executed cleanly with zero console output.', timestamp });
                }
            } else {
                capturedLogs.push({ type: 'info', message: `Executing ${languageId.toUpperCase()} program...`, timestamp });
                if (stdin.trim()) {
                    capturedLogs.push({ type: 'info', message: `[stdin]: ${stdin.trim()}`, timestamp });
                }

                const result = await executeCodeApi({
                    language: languageId,
                    code,
                    stdin
                });

                if (result.compileOutput && result.compileOutput.trim()) {
                    capturedLogs.push({
                        type: 'error',
                        message: `[Compilation Output]\n${result.compileOutput.trim()}`,
                        timestamp
                    });
                }

                if (result.stderr && result.stderr.trim()) {
                    capturedLogs.push({
                        type: 'error',
                        message: result.stderr.trim(),
                        timestamp
                    });
                }

                if (result.stdout && result.stdout.trim()) {
                    const stdoutLines = result.stdout.trim().split('\n');
                    stdoutLines.forEach(line => {
                        capturedLogs.push({ type: 'log', message: line, timestamp });
                    });
                } else if (!result.stderr && !result.compileOutput) {
                    capturedLogs.push({ type: 'info', message: 'Process finished with exit code 0 (no output)', timestamp });
                }

                if (result.timeSeconds != null) {
                    setExecutionTimeMs(Math.round(result.timeSeconds * 1000));
                }
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            capturedLogs.push({
                type: 'error',
                message: `Execution Error: ${msg}`,
                timestamp
            });
        } finally {
            const endTime = performance.now();
            setExecutionTimeMs(prev => prev !== null ? prev : Math.round(endTime - startTime));
            setLogs(capturedLogs);
            setIsRunning(false);
        }
    }, []);

    const clearConsole = useCallback(() => {
        setLogs([]);
        setHtmlPreview('');
        setExecutionTimeMs(null);
    }, []);

    return {
        logs,
        htmlPreview,
        isRunning,
        executionTimeMs,
        runCode,
        clearConsole
    };
}
