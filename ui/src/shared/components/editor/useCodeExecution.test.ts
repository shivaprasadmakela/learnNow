import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCodeExecution } from './useCodeExecution';
import { printedOutput } from './consoleOutput';

/**
 * Lesson snippets are checked against an expected output. Two things made that impossible for
 * JavaScript: code ran as a plain Function, so await was a syntax error and anything logged after a
 * promise settled was lost; and only the last logged line was compared with the whole expectation.
 */
describe('running JavaScript snippets', () => {
    const run = async (code: string) => {
        const { result } = renderHook(() => useCodeExecution());
        await act(async () => {
            await result.current.runCode(code, 'javascript');
        });
        return result.current.logs;
    };

    it('captures output logged after an await', async () => {
        const logs = await run(`
            console.log('before');
            await new Promise(resolve => setTimeout(resolve, 5));
            console.log('after');
        `);
        expect(printedOutput(logs)).toBe('before\nafter');
    });

    it('runs microtasks before timers, as a browser does', async () => {
        const logs = await run(`
            setTimeout(() => console.log('timeout'), 0);
            Promise.resolve().then(() => console.log('microtask'));
            console.log('sync');
            await new Promise(resolve => setTimeout(resolve, 10));
        `);
        expect(printedOutput(logs)).toBe('sync\nmicrotask\ntimeout');
    });

    it('reports a thrown error instead of output', async () => {
        const logs = await run(`throw new Error('boom');`);
        expect(printedOutput(logs)).toBe('');
        expect(logs.some(l => l.type === 'error' && l.message.includes('boom'))).toBe(true);
    });
});

describe('printedOutput', () => {
    it('joins every logged line, not just the last', () => {
        const at = '12:00:00';
        expect(
            printedOutput([
                { type: 'log', message: 'one', timestamp: at },
                { type: 'info', message: 'not program output', timestamp: at },
                { type: 'log', message: 'two', timestamp: at },
                { type: 'error', message: 'stderr is not stdout', timestamp: at },
            ])
        ).toBe('one\ntwo');
    });
});
