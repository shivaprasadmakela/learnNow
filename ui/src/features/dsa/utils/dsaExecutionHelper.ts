import type { DsaHarnessStub, DsaProblemDetail } from '../api/dsa.api';

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

/** What the language picker opens on, and the id every other default is measured against. */
export const DEFAULT_DSA_LANGUAGE = 'javascript';

/**
 * The languages this problem can actually be judged in.
 *
 * A verdict comes from the server, and the server needs a harness - a driver that reads stdin,
 * calls the learner's method and prints the answer - for the exact language being run. Offering a
 * language with no harness only buys a 404 the moment Run is pressed, so the picker is narrowed to
 * what the problem ships. JavaScript is floated to the front because it is the default.
 *
 * A problem with no harnesses at all is not judgeable, and its Run button is replaced by "Mark
 * solved" - the whole catalogue is returned there so the editor still has a syntax mode to offer.
 */
export function languagesForProblem(
    harnesses: DsaHarnessStub[] | undefined
): DsaLanguageOption[] {
    if (!harnesses || harnesses.length === 0) return DSA_SUPPORTED_LANGUAGES;

    const available = new Set(harnesses.map(h => h.language.trim().toLowerCase()));
    const supported = DSA_SUPPORTED_LANGUAGES.filter(option => available.has(option.id));

    return supported.length > 0 ? supported : DSA_SUPPORTED_LANGUAGES;
}

/**
 * JavaScript unless this problem cannot be judged in it, in which case the first language it can.
 */
export function defaultLanguageFor(harnesses: DsaHarnessStub[] | undefined): string {
    const options = languagesForProblem(harnesses);
    const js = options.find(option => option.id === DEFAULT_DSA_LANGUAGE);
    return js ? js.id : options[0].id;
}

/** The Monaco syntax mode for a language id, falling back to the id itself. */
export function monacoLanguageFor(language: string): string {
    const match = DSA_SUPPORTED_LANGUAGES.find(
        option => option.id.toLowerCase() === language.toLowerCase()
    );
    return match?.monacoLanguage ?? language;
}
