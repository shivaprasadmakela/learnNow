import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditorialPanel } from './EditorialPanel';
import type { DsaApproach } from '../../api/dsa.api';
import { fetchDsaEditorial } from '../../api/dsa.api';

/** The editorial is fetched only once the learner asks for it; the outline comes with the page. */
vi.mock('../../api/dsa.api', () => ({ fetchDsaEditorial: vi.fn() }));
vi.mock('../../api/adminDsa.api', () => ({ fetchDsaEditorialPreview: vi.fn() }));

/** Monaco does not load under jsdom; the viewer falls back to plain text, which is what is read. */
vi.mock('../../../../shared/components/editor/highlightCode', () => ({
    tokenizeLines: () => Promise.reject(new Error('no monaco in tests'))
}));

/** The real renderer reaches Monaco through its lesson playground; the markdown text is enough. */
vi.mock('../../../../shared/components/content-renderer', () => ({
    ContentRenderer: ({ blocks }: { blocks: Array<{ id: string; body?: string }> }) => (
        <div>
            {blocks.map(block => (
                <p key={block.id}>{block.body}</p>
            ))}
        </div>
    )
}));

const APPROACHES: DsaApproach[] = [
    {
        id: 'a2',
        kind: 'OPTIMAL',
        orderIndex: 2,
        intuition: 'Keep the best value seen so far.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        solutions: [
            { language: 'javascript', code: 'class Solution { /* js optimal */ }' },
            { language: 'python', code: 'class Solution:  # py optimal' },
            { language: 'java', code: 'class Solution { /* java optimal */ }' }
        ]
    },
    {
        id: 'a1',
        kind: 'BRUTE',
        orderIndex: 1,
        intuition: 'Sort and take the last element.',
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(n)',
        solutions: [{ language: 'java', code: 'class Solution { /* java brute */ }' }]
    }
];

const renderPanel = (overrides: Partial<React.ComponentProps<typeof EditorialPanel>> = {}) =>
    render(
        <EditorialPanel
            problemId="p1"
            approaches={APPROACHES}
            preferredLanguage="python"
            solved={false}
            {...overrides}
        />
    );

/** This jsdom build ships without Web Storage; the reveal flag needs a working one. */
const store = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, String(value)),
        removeItem: (key: string) => void store.delete(key),
        clear: () => store.clear()
    }
});

describe('EditorialPanel', () => {
    beforeEach(() => {
        store.clear();
        vi.mocked(fetchDsaEditorial)
            .mockReset()
            .mockResolvedValue({ problemId: 'p1', approaches: APPROACHES });
    });

    it('asks before showing the solution, and fetches it only on yes', async () => {
        renderPanel();

        expect(screen.getByText(/gives the solution away/)).toBeInTheDocument();
        expect(screen.queryByText(/java brute/)).not.toBeInTheDocument();
        expect(fetchDsaEditorial).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /Show the editorial/ }));
        expect(await screen.findByText(/java brute/)).toBeInTheDocument();
        expect(fetchDsaEditorial).toHaveBeenCalledWith('p1');
    });

    it('offers a retry when the editorial cannot be loaded', async () => {
        vi.mocked(fetchDsaEditorial).mockRejectedValueOnce(new Error('offline'));
        renderPanel({ solved: true });

        fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
        expect(await screen.findByText(/java brute/)).toBeInTheDocument();
    });

    it('remembers the reveal for that problem', () => {
        const { unmount } = renderPanel();
        fireEvent.click(screen.getByRole('button', { name: /Show the editorial/ }));
        unmount();

        renderPanel();
        expect(screen.queryByText(/gives the solution away/)).not.toBeInTheDocument();
    });

    it('skips the prompt once the problem is solved', () => {
        renderPanel({ solved: true });
        expect(screen.queryByText(/gives the solution away/)).not.toBeInTheDocument();
    });

    it('orders approaches brute force first, with complexity', async () => {
        renderPanel({ solved: true });

        await screen.findByText('Sort and take the last element.');
        const tabs = screen.getAllByRole('tab').slice(0, 2);
        expect(tabs.map(tab => tab.textContent)).toEqual(['Brute force', 'Optimal']);
        expect(screen.getByText('O(n log n)')).toBeInTheDocument();
        expect(screen.getByText('Sort and take the last element.')).toBeInTheDocument();
    });

    it('opens the code in the workspace language and lets the learner switch', async () => {
        renderPanel({ solved: true });
        fireEvent.click(await screen.findByRole('button', { name: /Next: Optimal/ }));

        expect(screen.getByText(/py optimal/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: 'Java' }));
        expect(screen.getByText(/java optimal/)).toBeInTheDocument();
    });

    it('falls back to a language the approach has when the workspace one is missing', async () => {
        renderPanel({ solved: true, preferredLanguage: 'cpp' });
        // Brute force is Java only: one label, no switcher.
        expect(await screen.findByText(/java brute/)).toBeInTheDocument();
        expect(screen.queryByRole('tablist', { name: 'Solution language' })).not.toBeInTheDocument();
    });

    it('shows code to read and copy, never a playground to run', async () => {
        renderPanel({ solved: true });
        expect(await screen.findByRole('button', { name: 'Copy code' })).toBeInTheDocument();
        expect(screen.queryByText(/Playground/)).not.toBeInTheDocument();
    });

    it('says so when there is no write-up yet', () => {
        renderPanel({ approaches: [] });
        expect(screen.getByText(/still being written/)).toBeInTheDocument();
    });
});
