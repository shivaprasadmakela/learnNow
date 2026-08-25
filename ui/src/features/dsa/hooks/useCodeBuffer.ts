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

/**
 * Single code buffer per problem and language.
 *
 * Saves drafts in localStorage keyed by problem slug and language.
 */
export const useCodeBuffer = (problemSlug: string, language: string, starterCode: string) => {
    const storageKey = `dsa_code_${problemSlug}_${language}`;

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
