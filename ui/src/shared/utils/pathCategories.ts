/**
 * The categories a path can belong to, in the order the catalog shows them.
 *
 * Mirrors PathCategory on the backend, which rejects anything else on write. Category used to be
 * free text, so every path ended up with a category of its own and the filter had nothing to
 * narrow.
 */
export const PATH_CATEGORIES = ['Backend', 'Frontend', 'Data'] as const;

export type PathCategory = (typeof PATH_CATEGORIES)[number];

const KNOWN: readonly string[] = PATH_CATEGORIES;

export const isPathCategory = (value: string): value is PathCategory => KNOWN.includes(value);

/**
 * Filter options for the paths actually loaded: known categories in their fixed order, then any
 * older value a database still holds, so no path is left unreachable from the filter. A category
 * with no paths is left out - a chip that empties the page is worse than no chip.
 */
export const categoriesForFilter = (present: ReadonlyArray<string | undefined>): string[] => {
    const seen = new Set(present.filter((c): c is string => Boolean(c)));
    const known = PATH_CATEGORIES.filter(c => seen.has(c));
    const legacy = [...seen].filter(c => !KNOWN.includes(c)).sort();
    return [...known, ...legacy];
};
