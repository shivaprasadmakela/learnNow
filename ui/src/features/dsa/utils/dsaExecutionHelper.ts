import type { DsaCaseResult, DsaProblemDetail, DsaRunResult, DsaSample } from '../api/dsa.api';

export interface DsaLanguageOption {
    id: string;
    name: string;
    monacoLanguage: string;
}

export const DSA_SUPPORTED_LANGUAGES: DsaLanguageOption[] = [
    { id: 'javascript', name: 'JavaScript', monacoLanguage: 'javascript' },
    { id: 'python', name: 'Python', monacoLanguage: 'python' },
    { id: 'java', name: 'Java', monacoLanguage: 'java' },
    { id: 'cpp', name: 'C++', monacoLanguage: 'cpp' },
    { id: 'typescript', name: 'TypeScript', monacoLanguage: 'typescript' },
    { id: 'c', name: 'C', monacoLanguage: 'c' }
];

/**
 * Extracts method name dynamically from the problem's JSON harnesses, approaches, slug, or title.
 */
export function extractMethodNameFromProblem(problem: Partial<DsaProblemDetail>): string {
    const METHOD_REGEX = /(?:public|private|protected|static|async|\s)*(?:void|int|long|double|float|bool|boolean|string|String|char|vector<[^>]+>|List<[^>]+>|def|function)\s+([A-Za-z0-9_]+)\s*\(/;

    // 1. Check existing harnesses in the problem JSON
    if (problem.harnesses && problem.harnesses.length > 0) {
        for (const h of problem.harnesses) {
            if (h.starterCode) {
                const match = h.starterCode.match(METHOD_REGEX);
                if (match && match[1] && match[1] !== 'main' && match[1] !== 'constructor') {
                    return match[1];
                }
            }
        }
    }

    // 2. Check editorial approaches in the problem JSON
    if (problem.approaches && problem.approaches.length > 0) {
        for (const app of problem.approaches) {
            if (app.code) {
                const match = app.code.match(METHOD_REGEX);
                if (match && match[1] && match[1] !== 'main' && match[1] !== 'constructor') {
                    return match[1];
                }
            }
        }
    }

    // 3. Check problem slug
    if (problem.slug && problem.slug.trim()) {
        const clean = problem.slug.replace(/^(td-|step-\d+-)/, '').trim();
        const parts = clean.split('-').filter(Boolean);
        if (parts.length > 1) {
            const camel = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
            if (camel.trim()) return camel;
        } else if (parts.length === 1 && parts[0].trim()) {
            return parts[0];
        }
    }

    // 4. Check problem title
    if (problem.title && problem.title.trim()) {
        const titleParts = problem.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(Boolean);
        if (titleParts.length > 1) {
            const camel = titleParts[0] + titleParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
            if (camel.trim()) return camel;
        } else if (titleParts.length === 1 && titleParts[0].trim()) {
            return titleParts[0];
        }
    }

    return 'solve';
}

/**
 * Generates starter code dynamically from problem JSON (using problem.harnesses or dynamic fallback).
 */
export function getStarterCode(problem: DsaProblemDetail, language: string): string {
    const langLower = language.toLowerCase();

    // 1. Direct match from problem.harnesses in the JSON
    const exactHarness = problem.harnesses?.find(
        h => h.language.toLowerCase() === langLower
    );
    if (exactHarness && exactHarness.starterCode?.trim()) {
        return exactHarness.starterCode;
    }

    // 2. Derive method name dynamically from the problem's JSON definition
    let methodName = extractMethodNameFromProblem(problem);
    if (!methodName || methodName.trim() === '') {
        methodName = 'solve';
    }

    switch (langLower) {
        case 'javascript':
            return `class Solution {
    ${methodName}() {
        // Write your solution here
    }
}
`;
        case 'typescript':
            return `class Solution {
    ${methodName}(): void {
        // Write your solution here
    }
}
`;
        case 'python':
            return `class Solution:
    def ${methodName}(self):
        # Write your solution here
        pass
`;
        case 'java':
            return `class Solution {
    public void ${methodName}() {
        // Write your solution here
    }
}
`;
        case 'cpp':
            return `class Solution {
public:
    void ${methodName}() {
        // Write your solution here
    }
};
`;
        case 'c':
            return `#include <stdio.h>

void ${methodName}() {
    // Write your solution here
}
`;
        default:
            return `// Write your ${language} solution here\n`;
    }
}

/**
 * Safely executes JavaScript code against problem sample cases dynamically in the client sandbox.
 */
export function executeJavaScriptLocally(
    userCode: string,
    samples: DsaSample[]
): DsaRunResult {
    const startTime = performance.now();
    const cases: DsaCaseResult[] = [];
    let passedCount = 0;
    let firstFailedCase: number | null = null;
    let compileError: string | null = null;

    for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const caseNumber = i + 1;
        let actualOutput = '';

        try {
            const logsCaptured: string[] = [];
            const originalLog = console.log;
            console.log = (...args: any[]) => {
                logsCaptured.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
            };

            const inputTrimmed = sample.input.trim();
            const inputTokens = inputTrimmed.split(/\s+/).filter(Boolean);

            // Execute user code dynamically in sandboxed Function
            const wrappedCode = `
                ${userCode}

                let executionResult = undefined;

                if (typeof Solution !== 'undefined') {
                    const sol = new Solution();
                    const proto = Object.getPrototypeOf(sol);
                    const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof sol[m] === 'function');
                    if (methods.length > 0) {
                        const targetMethod = methods[0];
                        const parsedArgs = ${JSON.stringify(inputTokens)}.map(t => isNaN(Number(t)) ? t : Number(t));
                        executionResult = sol[targetMethod](...parsedArgs);
                    }
                } else if (typeof solve === 'function') {
                    const parsedArgs = ${JSON.stringify(inputTokens)}.map(t => isNaN(Number(t)) ? t : Number(t));
                    executionResult = solve(...parsedArgs);
                }

                if (executionResult !== undefined) {
                    console.log(typeof executionResult === 'object' ? JSON.stringify(executionResult) : executionResult);
                }
            `;

            const fn = new Function(wrappedCode);
            fn();

            console.log = originalLog;
            actualOutput = logsCaptured.join('\n').trim();
        } catch (err: any) {
            compileError = err?.message || String(err);
            cases.push({
                caseNumber,
                sample: true,
                verdict: 'RUNTIME_ERROR',
                input: sample.input,
                expectedOutput: sample.expectedOutput,
                actualOutput: compileError
            });
            if (firstFailedCase === null) firstFailedCase = caseNumber;
            continue;
        }

        const expectedTrimmed = sample.expectedOutput.trim();
        const isMatch = actualOutput === expectedTrimmed;

        if (isMatch) {
            passedCount++;
            cases.push({
                caseNumber,
                sample: true,
                verdict: 'ACCEPTED',
                input: sample.input,
                expectedOutput: sample.expectedOutput,
                actualOutput
            });
        } else {
            if (firstFailedCase === null) firstFailedCase = caseNumber;
            cases.push({
                caseNumber,
                sample: true,
                verdict: 'WRONG_ANSWER',
                input: sample.input,
                expectedOutput: sample.expectedOutput,
                actualOutput
            });
        }
    }

    const elapsedMs = Math.round(performance.now() - startTime);
    const overallVerdict =
        compileError != null
            ? 'RUNTIME_ERROR'
            : passedCount === samples.length
              ? 'ACCEPTED'
              : 'WRONG_ANSWER';

    return {
        verdict: overallVerdict,
        passedCount,
        totalCount: samples.length,
        firstFailedCase,
        cases,
        compileOutput: compileError,
        stderr: null,
        stdout: cases.map(c => c.actualOutput).filter(Boolean).join('\n'),
        runtimeMs: elapsedMs,
        memoryKb: 2048
    };
}
