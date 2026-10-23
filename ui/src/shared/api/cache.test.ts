import { afterEach, describe, expect, it, vi } from 'vitest';
import { cachedResource, progressChanged } from './cache';

describe('cachedResource', () => {
    afterEach(() => vi.useRealTimers());

    it('shares one request between callers and serves the answer until it is stale', async () => {
        vi.useFakeTimers();
        const load = vi.fn().mockResolvedValue('v1');
        const cache = cachedResource(load, { maxAgeMs: 30_000 });

        const [a, b] = await Promise.all([cache.get(), cache.get()]);
        expect([a, b]).toEqual(['v1', 'v1']);
        expect(cache.peek()).toBe('v1');
        expect(load).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(30_001);
        expect(cache.peek()).toBeUndefined();
        await cache.get();
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('does not cache a failure', async () => {
        const load = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue('ok');
        const cache = cachedResource(load);

        await expect(cache.get()).rejects.toThrow('down');
        await expect(cache.get()).resolves.toBe('ok');
    });

    it('drops progress-dependent answers when progress changes, and only those', async () => {
        const progress = vi.fn().mockResolvedValue('p');
        const contact = vi.fn().mockResolvedValue('c');
        const dashboard = cachedResource(progress, { resetOnProgress: true });
        const footer = cachedResource(contact);
        await dashboard.get();
        await footer.get();

        progressChanged();

        expect(dashboard.peek()).toBeUndefined();
        expect(footer.peek()).toBe('c');
    });

    it('does not let a request started before an invalidation repopulate the cache', async () => {
        let resolve!: (v: string) => void;
        const cache = cachedResource(
            vi.fn().mockImplementationOnce(() => new Promise<string>(r => (resolve = r)))
        );
        const pending = cache.get();
        cache.invalidate();
        resolve('old');
        await pending;

        expect(cache.peek()).toBeUndefined();
    });
});
