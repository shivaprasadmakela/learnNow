import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Loader } from './Loader';

/**
 * The cold-start loader.
 *
 * <p>Everything here is time-driven, which is exactly the kind of code that breaks without
 * anything throwing — the screen simply sits there saying one thing forever, and nobody notices
 * because a loading screen is supposed to look like it is waiting. The rotation below had been
 * dead for as long as it had existed for precisely that reason.
 */
describe('Loader cold start', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('rotates its message instead of showing one line forever', async () => {
        // Regression cover. elapsedTime used to be a dependency of the rotation effect, and since
        // it ticks every 500ms the cleanup cleared the 3.5s interval before it could ever fire.
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        render(<Loader variant="inline" />);

        await vi.advanceTimersByTimeAsync(2500);
        const first = screen.getByText(/Waking up the backend server/i).textContent;

        await vi.advanceTimersByTimeAsync(4000);
        const second = screen.queryByText(/Waking up the backend server/i);

        expect(second === null || second.textContent !== first).toBe(true);
    });

    it('names the stage the server is really in, and counts the wait', async () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        render(<Loader variant="inline" />);

        await vi.advanceTimersByTimeAsync(10000);

        // 10s lands in the database-connection stage of the measured profile.
        expect(screen.getByText(/Opening the database connection/i)).toBeInTheDocument();
        expect(screen.getByText(/^10s$/)).toBeInTheDocument();

        const bar = screen.getByRole('progressbar', { name: /start-up progress/i });
        const value = Number(bar.getAttribute('aria-valuenow'));
        expect(value).toBeGreaterThan(0);
        // Never full: the request is not done until it is done.
        expect(value).toBeLessThanOrEqual(95);
    });

    it('asks the backend whether it is up, and says so when it is', async () => {
        const fetchMock = vi.fn((url: RequestInfo | URL) => {
            void url;
            return Promise.resolve({ ok: true } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<Loader variant="inline" />);
        // Past the 2.5s poll threshold, with room for the response to settle and re-render.
        await vi.advanceTimersByTimeAsync(4000);

        const polled = fetchMock.mock.calls.some(call =>
            String(call[0]).includes('/actuator/health')
        );
        expect(polled).toBe(true);

        // The old code fetched '/api/health', which does not exist and was relative, so on the
        // deployed site it never reached the API at all.
        const askedForTheOldPath = fetchMock.mock.calls.some(
            call => String(call[0]) === '/api/health'
        );
        expect(askedForTheOldPath).toBe(false);

        expect(screen.getByText(/Server is awake/i)).toBeInTheDocument();
    });

    it('admits when it has overrun the estimate rather than freezing', async () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        render(<Loader variant="inline" />);

        await vi.advanceTimersByTimeAsync(40000);

        expect(screen.getByText(/slower than usual/i)).toBeInTheDocument();
    });

    it('lets the animation be changed, as a real button', async () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        render(<Loader variant="inline" />);
        await vi.advanceTimersByTimeAsync(3000);

        // A button rather than a div with a click handler, so the one thing there is to do during
        // a twenty second wait is reachable from the keyboard too.
        const toggle = screen.getByRole('button', { name: /change the animation/i });
        const before = toggle.className;

        fireEvent.click(toggle);

        expect(toggle.className).not.toBe(before);
    });

    it('offers a way out once it has clearly overrun', async () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        render(<Loader variant="inline" />);

        await vi.advanceTimersByTimeAsync(10000);
        expect(screen.queryByRole('button', { name: /reload/i })).not.toBeInTheDocument();

        await vi.advanceTimersByTimeAsync(30000);
        expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
    });

    it('stays quiet and ordinary for a short wait', async () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        render(<Loader variant="inline" text="Loading topics..." />);

        await vi.advanceTimersByTimeAsync(1000);

        expect(screen.getByText('Loading topics...')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
});
