import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTopicSession } from './useTopicSession';
import type { Course } from '../../types';

const fetchTopicDetails = vi.fn();

vi.mock('../../shared/api', () => ({
    fetchTopicDetails: (...a: unknown[]) => fetchTopicDetails(...a),
    invalidatePathsCache: vi.fn()
}));

vi.mock('../../features/activity', () => ({
    useRecordActivity: () => ({
        recordTopicCompletion: vi.fn(),
        recordSubtopicCompletion: vi.fn()
    })
}));

const STUDY_URL = '/paths/java-backend-developer-spring-boot/introduction-to-the-java-platform/writing-first-program';

/**
 * Refreshing inside the study console. `activeView` comes back as STUDY straight from the URL,
 * which means the path list is never fetched - so the topic slug has nothing to match against
 * and the console used to sit on "Loading Study Console..." indefinitely.
 */
describe('useTopicSession restoring a topic from the URL', () => {
    const changeView = vi.fn();
    const showToast = vi.fn();

    const options = (courses: Course[], resolveTopicIdBySlug?: ReturnType<typeof vi.fn>) => ({
        isLoggedIn: true,
        courses,
        changeView,
        showToast,
        resolveTopicIdBySlug
    });

    beforeEach(() => {
        vi.clearAllMocks();
        window.history.replaceState({}, '', STUDY_URL);
        fetchTopicDetails.mockResolvedValue({ id: 11, title: 'Introduction to the Java platform' });
    });
    afterEach(() => vi.clearAllMocks());

    it('resolves the slug when no paths are loaded, and opens the topic', async () => {
        const resolve = vi.fn().mockResolvedValue(11);

        const { result } = renderHook(() => useTopicSession(options([], resolve)));

        await waitFor(() => expect(result.current.activeTopic).not.toBeNull());
        expect(resolve).toHaveBeenCalledWith(
            'java-backend-developer-spring-boot',
            'introduction-to-the-java-platform'
        );
        expect(fetchTopicDetails).toHaveBeenCalledWith(11);
    });

    it('leaves the URL alone, keeping the subtopic the link points at', async () => {
        const resolve = vi.fn().mockResolvedValue(11);

        const { result } = renderHook(() => useTopicSession(options([], resolve)));

        await waitFor(() => expect(result.current.activeTopic).not.toBeNull());
        expect(changeView).not.toHaveBeenCalled();
        expect(window.location.pathname).toBe(STUDY_URL);
    });

    it('uses an already loaded topic without asking the server to resolve it', async () => {
        const resolve = vi.fn();
        const courses = [
            {
                id: 1,
                title: 'Java Backend Developer (Spring Boot)',
                topics: [{ id: 11, title: 'Introduction to the Java platform' }]
            }
        ] as unknown as Course[];

        const { result } = renderHook(() => useTopicSession(options(courses, resolve)));

        await waitFor(() => expect(result.current.activeTopic).not.toBeNull());
        expect(resolve).not.toHaveBeenCalled();
        expect(window.location.pathname).toBe(STUDY_URL);
    });

    it('gives up visibly when the URL names nothing, instead of spinning', async () => {
        const resolve = vi.fn().mockResolvedValue(null);

        renderHook(() => useTopicSession(options([], resolve)));

        await waitFor(() => expect(showToast).toHaveBeenCalled());
        expect(changeView).toHaveBeenCalledWith('PATHS');
        expect(fetchTopicDetails).not.toHaveBeenCalled();
    });

    it('resolves a URL once, however often courses change', async () => {
        const resolve = vi.fn().mockResolvedValue(11);
        const { rerender } = renderHook(
            ({ courses }: { courses: Course[] }) => useTopicSession(options(courses, resolve)),
            { initialProps: { courses: [] as Course[] } }
        );

        await waitFor(() => expect(resolve).toHaveBeenCalledTimes(1));
        rerender({ courses: [{ id: 1, title: 'Something else', topics: [] }] as unknown as Course[] });
        rerender({ courses: [{ id: 2, title: 'Another', topics: [] }] as unknown as Course[] });

        expect(resolve).toHaveBeenCalledTimes(1);
    });
});
