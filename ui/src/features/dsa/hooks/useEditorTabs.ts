import { useCallback, useEffect, useState } from 'react';

export interface EditorTab {
    id: string;
    label: string;
    code: string;
}

const MAX_TABS = 5;

/**
 * Scratch tabs for one problem in one language.
 *
 * Purely client-side. Several attempts side by side is genuinely useful while solving, but it is a
 * working habit rather than data worth a table and a sync story — so it lives in localStorage, keyed
 * per problem and language, and is simply gone if the learner clears their browser.
 */
export const useEditorTabs = (problemSlug: string, language: string, starterCode: string) => {
    const storageKey = `dsa_draft_${problemSlug}_${language}`;

    const [tabs, setTabs] = useState<EditorTab[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    // Reload whenever the problem or language changes: the drafts are per pair.
    useEffect(() => {
        let restored: EditorTab[] | null = null;
        if (typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem(storageKey);
                const parsed = raw ? JSON.parse(raw) : null;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    restored = parsed.filter(
                        (t): t is EditorTab =>
                            t && typeof t.id === 'string' && typeof t.code === 'string'
                    );
                }
            } catch {
                // A corrupt draft should not stop the editor opening.
            }
        }

        const initial =
            restored && restored.length > 0
                ? restored
                : [{ id: 'tab-1', label: 'Tab-1', code: starterCode }];
        setTabs(initial);
        setActiveId(initial[0].id);
    }, [storageKey, starterCode]);

    const persist = useCallback(
        (next: EditorTab[]) => {
            if (typeof localStorage === 'undefined') return;
            try {
                localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // Quota exceeded, private mode, and so on. Losing a draft is better than throwing.
            }
        },
        [storageKey]
    );

    const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0];

    const setCode = useCallback(
        (code: string) => {
            setTabs(prev => {
                const next = prev.map(t => (t.id === activeId ? { ...t, code } : t));
                persist(next);
                return next;
            });
        },
        [activeId, persist]
    );

    const addTab = useCallback(() => {
        setTabs(prev => {
            if (prev.length >= MAX_TABS) return prev;
            // Numbered off the highest existing label, so closing Tab-2 then adding gives Tab-3
            // rather than a second Tab-2.
            const highest = prev.reduce((max, t) => {
                const n = Number(t.label.replace(/\D/g, ''));
                return Number.isFinite(n) ? Math.max(max, n) : max;
            }, 0);
            const created = {
                id: `tab-${highest + 1}`,
                label: `Tab-${highest + 1}`,
                code: starterCode
            };
            const next = [...prev, created];
            persist(next);
            setActiveId(created.id);
            return next;
        });
    }, [persist, starterCode]);

    const closeTab = useCallback(
        (id: string) => {
            setTabs(prev => {
                if (prev.length <= 1) return prev;
                const next = prev.filter(t => t.id !== id);
                persist(next);
                if (id === activeId) setActiveId(next[0].id);
                return next;
            });
        },
        [activeId, persist]
    );

    const resetActive = useCallback(() => {
        setCode(starterCode);
    }, [setCode, starterCode]);

    return {
        tabs,
        activeTab,
        activeId,
        setActiveId,
        setCode,
        addTab,
        closeTab,
        resetActive,
        canAddTab: tabs.length < MAX_TABS
    };
};

export default useEditorTabs;
