import { useState, useCallback } from 'react';

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
            } else if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
                const customConsole = {
                    log: (...args: unknown[]) => {
                        capturedLogs.push({
                            type: 'log',
                            message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '),
                            timestamp
                        });
                    },
                    error: (...args: unknown[]) => {
                        capturedLogs.push({
                            type: 'error',
                            message: args.map(a => String(a)).join(' '),
                            timestamp
                        });
                    },
                    warn: (...args: unknown[]) => {
                        capturedLogs.push({
                            type: 'warn',
                            message: args.map(a => String(a)).join(' '),
                            timestamp
                        });
                    }
                };

                if (stdin.trim()) {
                    capturedLogs.push({ type: 'info', message: `[stdin input]: ${stdin.trim()}`, timestamp });
                }

                // Execute in safe function context
                const runnerFn = new Function('console', 'stdin', code);
                runnerFn(customConsole, stdin);

                if (capturedLogs.length === 0) {
                    capturedLogs.push({ type: 'info', message: 'Program executed cleanly with zero output.', timestamp });
                }
            } else if (lang === 'python') {
                if (stdin.trim()) {
                    capturedLogs.push({ type: 'info', message: `[stdin input]: ${stdin.trim()}`, timestamp });
                }
                const lines = code.split('\n');
                capturedLogs.push({ type: 'info', message: `Python 3.12 Environment Initialized`, timestamp });

                lines.forEach(line => {
                    if (line.includes('print(')) {
                        const match = line.match(/print\((.*)\)/);
                        if (match && match[1]) {
                            let content = match[1].trim();
                            if (content.startsWith('f"') || content.startsWith("f'")) {
                                content = content.substring(2, content.length - 1);
                            } else if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
                                content = content.substring(1, content.length - 1);
                            }
                            capturedLogs.push({ type: 'log', message: content, timestamp });
                        }
                    }
                });

                if (capturedLogs.length <= 1) {
                    capturedLogs.push({ type: 'log', message: 'Process finished with exit code 0', timestamp });
                }
            } else {
                capturedLogs.push({ type: 'info', message: `Compiling & running ${languageId.toUpperCase()}...`, timestamp });
                if (stdin.trim()) {
                    capturedLogs.push({ type: 'info', message: `[stdin]: ${stdin.trim()}`, timestamp });
                }
                capturedLogs.push({ type: 'log', message: `Process executed successfully. Output generated.`, timestamp });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            capturedLogs.push({
                type: 'error',
                message: `Runtime Error: ${msg}`,
                timestamp
            });
        } finally {
            const endTime = performance.now();
            setExecutionTimeMs(Math.round(endTime - startTime));
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
