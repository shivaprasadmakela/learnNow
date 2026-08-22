/**
 * Client-side half of the backend's `PageResponse` envelope.
 *
 * Every list endpoint that can grow without bound - paths, topics, the admin catalogue - returns
 * one page at a time and the UI scrolls to fetch the next. `DEFAULT_PAGE_SIZE` mirrors the
 * server's own default, so a request that omits `size` and one that sends it agree.
 */
export const DEFAULT_PAGE_SIZE = 10;

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
}

export const emptyPage = <T,>(size: number = DEFAULT_PAGE_SIZE): PageResponse<T> => ({
    content: [],
    page: 0,
    size,
    totalElements: 0,
    totalPages: 0,
    hasNext: false
});

/**
 * Normalises a list response into a page.
 *
 * A deployed UI can outlive the backend it was built against - and during a rolling deploy it
 * talks to both - so a plain array coming back from an endpoint that has not been updated yet is
 * treated as a single complete page rather than crashing the view.
 */
export const toPageResponse = <T,>(
    body: PageResponse<T> | T[] | null | undefined,
    requestedSize: number = DEFAULT_PAGE_SIZE
): PageResponse<T> => {
    if (Array.isArray(body)) {
        return {
            content: body,
            page: 0,
            size: body.length,
            totalElements: body.length,
            totalPages: 1,
            hasNext: false
        };
    }
    if (!body || !Array.isArray(body.content)) return emptyPage<T>(requestedSize);
    return {
        content: body.content,
        page: body.page ?? 0,
        size: body.size ?? requestedSize,
        totalElements: body.totalElements ?? body.content.length,
        totalPages: body.totalPages ?? 1,
        hasNext: Boolean(body.hasNext)
    };
};

/** Appends `page`/`size` to a URL that may already carry a query string. */
export const withPageParams = (url: string, page: number, size: number): string => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}page=${page}&size=${size}`;
};

/**
 * Walks every page and returns the flattened result.
 *
 * Only for the handful of places that genuinely need the whole list at once - a `<select>` of
 * every course, for instance, where there is nothing to scroll. Uses a large page size so that
 * stays a couple of round trips rather than dozens.
 */
export const fetchAllPages = async <T,>(
    loadPage: (page: number, size: number) => Promise<PageResponse<T>>,
    size: number = 100,
    maxPages: number = 50
): Promise<T[]> => {
    const all: T[] = [];
    for (let page = 0; page < maxPages; page += 1) {
        const result = await loadPage(page, size);
        all.push(...result.content);
        if (!result.hasNext || result.content.length === 0) break;
    }
    return all;
};
