import type { ConsoleLogEntry } from './useCodeExecution';

/**
 * Everything a run printed, as one string - the value an expected output is compared against.
 *
 * In-browser JavaScript records one entry per console.log, while the cloud executor returns all of
 * stdout as a single entry. Comparing only the last entry, as the code block used to, made every
 * JavaScript example that prints more than one line report a mismatch even when it was right.
 */
export const printedOutput = (logs: ConsoleLogEntry[]): string =>
    logs
        .filter(l => l.type === 'log')
        .map(l => l.message)
        .join('\n')
        .trim();
