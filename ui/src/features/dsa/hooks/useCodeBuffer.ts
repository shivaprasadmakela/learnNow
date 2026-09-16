import { useCallback, useEffect, useState } from 'react';

/**
 * Checks if saved code has broken empty method declarations (e.g. "() {" or "(): void").
 */
function isBrokenEmptyDraft(codeStr: string): boolean {
    const trimmed = codeStr.trim();
    if (!trimmed) return true;
    return (
        trimmed.includes('    () {') ||
        trimmed.includes('    (): void') ||
        trimmed.includes('def (self):') ||
        trimmed.includes('void () {') ||
        trimmed.includes('void ()')
    );
}

/** Where one problem's draft for one language lives. */
export const draftKey = (problemSlug: string, language: string) =>
    `dsa_code_${problemSlug}_${language}`;

/**
 * Writes a draft for a language that may not be the one on screen.
 *
 * Loading an old submission back into the editor switches language and content together, and the
 * buffer reloads itself from storage whenever the language changes - so setting the code alone
 * would be undone a render later by the draft that was already saved for the language being
 * switched to. Writing the draft first means the reload restores the submission.
 */
export const writeDraft = (problemSlug: string, language: string, code: string) => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(draftKey(problemSlug, language), code);
    } catch {
        // Quota / private mode. The in-memory setCode still applies.
    }
};

/**
 * Single code buffer per problem and language.
 *
 * Saves drafts in localStorage keyed by problem slug and language.
 */
export const useCodeBuffer = (problemSlug: string, language: string, starterCode: string) => {
    const storageKey = draftKey(problemSlug, language);

    const [code, setCodeState] = useState<string>(() => {
        if (typeof localStorage !== 'undefined' && storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved !== null && saved.trim().length > 0 && !isBrokenEmptyDraft(saved)) {
                    return saved;
                }
            } catch {
                // Ignore storage errors
            }
        }
        return starterCode;
    });

    useEffect(() => {
        let restored: string | null = null;
        if (typeof localStorage !== 'undefined') {
            try {
                restored = localStorage.getItem(storageKey);
            } catch {
                // Ignore storage errors
            }
        }
        if (restored !== null && restored.trim().length > 0 && !isBrokenEmptyDraft(restored)) {
            setCodeState(restored);
        } else {
            setCodeState(starterCode);
        }
    }, [storageKey, starterCode]);

    const setCode = useCallback(
        (nextCode: string) => {
            setCodeState(nextCode);
            if (typeof localStorage !== 'undefined') {
                try {
                    localStorage.setItem(storageKey, nextCode);
                } catch {
                    // Ignore quota / private mode errors
                }
            }
        },
        [storageKey]
    );

    const resetCode = useCallback(() => {
        setCode(starterCode);
    }, [setCode, starterCode]);

    return {
        code,
        setCode,
        resetCode
    };
};

export default useCodeBuffer;
