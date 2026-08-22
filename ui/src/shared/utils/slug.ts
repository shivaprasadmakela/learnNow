/**
 * URL slugs for paths and topics.
 *
 * Slugs are derived from titles rather than stored, so the same derivation has to be used to
 * build a URL and to read one back. Keeping both here means a deep link cannot stop resolving
 * because one caller spells the rule slightly differently from another.
 */
export const slugify = (text: string): string =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

/** Punctuation-insensitive form, for comparing a title against a slug from an older link. */
const squash = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Whether `slug` addresses something titled `title`.
 *
 * Titles get edited - punctuation and capitalisation especially - and links outlive those edits,
 * so an exact slug match is tried first and a punctuation-insensitive comparison second.
 */
export const matchesSlug = (title: string | undefined, slug: string): boolean => {
    if (!title || !slug) return false;
    return slugify(title) === slug || squash(title) === squash(slug);
};
