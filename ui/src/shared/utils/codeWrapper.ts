/**
 * Whether a block of code from a lesson can run on its own, and as what.
 *
 * Lesson text is full of illustrations - a method body, an expression, a query against tables that
 * do not exist, `{ ... }` standing in for the rest. Offering "Try in Playground" on those only
 * produced compile errors, so the offer is made for whole programs alone. Code worth running in a
 * lesson is a snippet, whose output the content build has already verified.
 *
 * Preparing Java for the executor - fitting a snippet's own class names to Main.java - happens on
 * the server, in one place, for every caller.
 */

/** Something standing in for omitted code, which no compiler will accept. */
const PLACEHOLDER = /\.\.\.|…/;

export type PlaygroundLanguage = 'java' | 'javascript' | 'typescript' | 'python';

const ALIASES: Record<string, PlaygroundLanguage> = {
    java: 'java',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    python: 'python',
    py: 'python'
};

/**
 * The language to run `code` as, or null when it is a fragment rather than a program. SQL is never
 * runnable here: lessons are written for PostgreSQL, and there is no database behind the
 * playground for a query to read.
 */
export function playgroundLanguage(code: string, lang: string): PlaygroundLanguage | null {
    const language = ALIASES[(lang || '').trim().toLowerCase().replace(/^language-/, '')];
    if (!language || !code?.trim()) return null;

    switch (language) {
        case 'java':
            return /static\s+void\s+main\s*\(/.test(code) ? language : null;
        case 'javascript':
        case 'typescript':
            // Modules and JSX need a bundler; output is what makes a run worth doing.
            if (PLACEHOLDER.test(code) || /^\s*(import|export)\s/m.test(code) || /<[A-Z][\w.]*[\s/>]/.test(code)) {
                return null;
            }
            return /console\.(log|error|warn|table)\s*\(/.test(code) ? language : null;
        case 'python':
            return !/^\s*\.\.\.\s*$/m.test(code) && /\bprint\s*\(/.test(code) ? language : null;
        default:
            return null;
    }
}
