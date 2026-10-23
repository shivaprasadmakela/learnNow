import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BookmarkedTopicsList } from './BookmarkedTopicsList';

const fetchBookmarkSummaries = vi.fn();
const toggleBookmarkApi = vi.fn();

vi.mock('../../../notes/api/notes.api', () => ({
    fetchBookmarkSummaries: () => fetchBookmarkSummaries(),
    toggleBookmarkApi: (...a: unknown[]) => toggleBookmarkApi(...a)
}));

const topic = {
    id: 'b1',
    target: 'TOPIC',
    targetId: 't1',
    createdAt: '2026-10-01T00:00:00Z',
    topic: {
        title: 'Spring Profiles',
        description: 'Per-environment config',
        pathId: 'p1',
        pathTitle: 'Spring Boot',
        progressPercentage: 50,
        completed: false
    },
    problem: null
};

const problem = {
    id: 'b2',
    target: 'DSA_PROBLEM',
    targetId: 'd1',
    createdAt: '2026-10-02T00:00:00Z',
    topic: null,
    problem: {
        slug: 'two-sum',
        title: 'Two Sum',
        difficulty: 'EASY',
        stepSlug: 'arrays',
        stepTitle: 'Arrays',
        status: 'SOLVED'
    }
};

/**
 * The list used to resolve each bookmark with its own full-content request. It now renders from a
 * single summary call, and removing a DSA bookmark goes to the DSA endpoint, not the topic one.
 */
describe('BookmarkedTopicsList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchBookmarkSummaries.mockResolvedValue([problem, topic]);
        toggleBookmarkApi.mockResolvedValue({ bookmarked: false });
    });

    it('renders every bookmark from one request', async () => {
        render(<BookmarkedTopicsList />);

        expect(await screen.findByText('Spring Profiles')).toBeTruthy();
        expect(screen.getByText('Two Sum')).toBeTruthy();
        expect(fetchBookmarkSummaries).toHaveBeenCalledTimes(1);
    });

    it('opens a topic with its path, for the study console', async () => {
        const onSelectRecentTopic = vi.fn();
        render(<BookmarkedTopicsList onSelectRecentTopic={onSelectRecentTopic} />);

        fireEvent.click(await screen.findByText('Spring Profiles'));

        expect(onSelectRecentTopic).toHaveBeenCalledWith({
            topicId: 't1',
            topicTitle: 'Spring Profiles',
            pathTitle: 'Spring Boot'
        });
    });

    it('opens a problem by its step and slug', async () => {
        const onSelectDsaProblem = vi.fn();
        render(<BookmarkedTopicsList onSelectDsaProblem={onSelectDsaProblem} />);

        fireEvent.click(await screen.findByText('Two Sum'));

        expect(onSelectDsaProblem).toHaveBeenCalledWith('arrays', 'two-sum');
    });

    it('removes a problem bookmark through the problem endpoint', async () => {
        fetchBookmarkSummaries.mockResolvedValue([problem]);
        render(<BookmarkedTopicsList />);
        await screen.findByText('Two Sum');

        const remove = screen.getAllByRole('button').find(b =>
            /bookmark/i.test(b.getAttribute('aria-label') ?? b.getAttribute('title') ?? '')
        );
        expect(remove).toBeTruthy();
        fireEvent.click(remove!);

        await waitFor(() => expect(toggleBookmarkApi).toHaveBeenCalledWith('d1', 'DSA_PROBLEM'));
        await waitFor(() => expect(screen.queryByText('Two Sum')).toBeNull());
    });
});
