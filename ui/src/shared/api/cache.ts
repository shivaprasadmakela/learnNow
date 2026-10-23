/**
 * A module-level cache for one GET, so screens that mount repeatedly - or several components on
 * one screen - share a response instead of each asking again.
 *
 * Concurrent callers share one in-flight request. A failure is never cached, so the next caller
 * retries. `maxAgeMs` bounds how stale an answer may be; leave it out for data that does not change
 * within a session.
 */
export interface CachedResource<T> {
    /** The cached value while it is fresh, otherwise a new request. `force` always refetches. */
    get(force?: boolean): Promise<T>;
    /** The cached value if it is still fresh, without fetching - for a first render. */
    peek(): T | undefined;
    /** Drops the cached value; the next `get` fetches. */
    invalidate(): void;
}

interface Options {
    maxAgeMs?: number;
    /** Dropped whenever {@link progressChanged} is called. */
    resetOnProgress?: boolean;
}

const progressListeners = new Set<() => void>();

/**
 * Tells every progress-dependent cache that the learner's progress or points just changed - a
 * lesson or topic marked, a quiz answered, a problem solved. Their next read refetches.
 */
export const progressChanged = (): void => {
    progressListeners.forEach(reset => reset());
};

export function cachedResource<T>(
    load: () => Promise<T>,
    { maxAgeMs = Infinity, resetOnProgress = false }: Options = {}
): CachedResource<T> {
    let value: { data: T; at: number } | null = null;
    let inFlight: Promise<T> | null = null;
    // Bumped on invalidate, so a request started before it cannot repopulate the cache after it.
    let generation = 0;

    const isFresh = () => value !== null && Date.now() - value.at < maxAgeMs;

    const invalidate = () => {
        value = null;
        inFlight = null;
        generation++;
    };
    if (resetOnProgress) progressListeners.add(invalidate);

    return {
        get(force = false) {
            if (!force && value !== null && isFresh()) return Promise.resolve(value.data);
            if (!force && inFlight) return inFlight;

            const startedIn = generation;
            const request = load().then(
                data => {
                    if (startedIn === generation) {
                        value = { data, at: Date.now() };
                        inFlight = null;
                    }
                    return data;
                },
                err => {
                    if (startedIn === generation) inFlight = null;
                    throw err;
                }
            );
            inFlight = request;
            return request;
        },
        peek() {
            return value !== null && isFresh() ? value.data : undefined;
        },
        invalidate
    };
}
