import { describe, expect, it } from 'vitest';
import {
    DEFAULT_DSA_LANGUAGE,
    DSA_SUPPORTED_LANGUAGES,
    defaultLanguageFor,
    languagesForProblem,
    monacoLanguageFor
} from './dsaExecutionHelper';

const harness = (language: string) => ({ language, starterCode: '' });

describe('languagesForProblem', () => {
    it('offers only the languages the problem ships a harness for', () => {
        const options = languagesForProblem([harness('java'), harness('cpp')]);

        expect(options.map(o => o.id)).toEqual(['java', 'cpp']);
    });

    it('matches a harness language regardless of case or padding', () => {
        const options = languagesForProblem([harness('  JavaScript ')]);

        expect(options.map(o => o.id)).toEqual(['javascript']);
    });

    it('ignores a harness for a language the editor does not support', () => {
        const options = languagesForProblem([harness('javascript'), harness('kotlin')]);

        expect(options.map(o => o.id)).toEqual(['javascript']);
    });

    it('falls back to the whole catalogue when the problem has no harnesses', () => {
        // Such a problem is not judgeable at all, but the editor still needs a syntax mode.
        expect(languagesForProblem([])).toEqual(DSA_SUPPORTED_LANGUAGES);
        expect(languagesForProblem(undefined)).toEqual(DSA_SUPPORTED_LANGUAGES);
    });
});

describe('defaultLanguageFor', () => {
    it('opens on JavaScript', () => {
        expect(defaultLanguageFor([harness('java'), harness('javascript')])).toBe(
            DEFAULT_DSA_LANGUAGE
        );
        expect(defaultLanguageFor([])).toBe(DEFAULT_DSA_LANGUAGE);
        expect(defaultLanguageFor(undefined)).toBe(DEFAULT_DSA_LANGUAGE);
    });

    it('picks a judgeable language when the problem has no JavaScript harness', () => {
        // Defaulting to JavaScript here would guarantee a 404 the moment Run is pressed.
        // The choice follows catalogue order rather than the order the harnesses arrived in, so
        // the same problem always opens on the same language.
        expect(defaultLanguageFor([harness('cpp'), harness('java')])).toBe('java');
        expect(defaultLanguageFor([harness('cpp')])).toBe('cpp');
    });
});

describe('monacoLanguageFor', () => {
    it('maps an id to its syntax mode, and passes anything unknown through', () => {
        expect(monacoLanguageFor('cpp')).toBe('cpp');
        expect(monacoLanguageFor('JavaScript')).toBe('javascript');
        expect(monacoLanguageFor('kotlin')).toBe('kotlin');
    });
});
