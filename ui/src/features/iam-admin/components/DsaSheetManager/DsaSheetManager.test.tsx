import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { DsaSheetManager } from './DsaSheetManager';
import type { AdminDsaSheet } from '../../../dsa/api/adminDsa.api';

const fetchAdminDsaSheets = vi.fn();
const updateDsaSection = vi.fn();
const deleteDsaSection = vi.fn();
const deleteDsaProblem = vi.fn();
const updateDsaStep = vi.fn();
const deleteDsaStep = vi.fn();

vi.mock('../../../dsa/api/adminDsa.api', () => ({
    fetchAdminDsaSheets: (...args: unknown[]) => fetchAdminDsaSheets(...args),
    updateDsaSection: (...args: unknown[]) => updateDsaSection(...args),
    deleteDsaSection: (...args: unknown[]) => deleteDsaSection(...args),
    deleteDsaProblem: (...args: unknown[]) => deleteDsaProblem(...args),
    updateDsaStep: (...args: unknown[]) => updateDsaStep(...args),
    deleteDsaStep: (...args: unknown[]) => deleteDsaStep(...args),
    generateExpectedOutputs: vi.fn(),
    publishDsaProblem: vi.fn(),
    publishDsaSheet: vi.fn()
}));

/** The editor dialog pulls in Monaco and the whole learner workspace; this test is about the tree. */
vi.mock('../DsaProblemEditorModal', () => ({
    DsaProblemEditorModal: ({ problemId }: { problemId: string | null }) =>
        problemId ? <div data-testid="editor-modal">{problemId}</div> : null
}));

const problem = (id: string, title: string, over: Record<string, unknown> = {}) => ({
    id,
    slug: id,
    title,
    difficulty: 'EASY' as const,
    status: 'PUBLISHED' as const,
    orderIndex: 1,
    hasVideo: false,
    harnessCount: 1,
    testCaseCount: 2,
    missingExpectedCount: 0,
    ...over
});

/** Four grouping levels, because the content already goes three deep and is heading for four. */
const SHEET: AdminDsaSheet = {
    id: 'sheet-1',
    slug: 'dsa-a2z',
    title: 'DSA A to Z',
    status: 'DRAFT',
    steps: [
        {
            id: 'step-1',
            slug: 'step-01',
            orderIndex: 1,
            title: 'Learn the basics',
            sections: [
                {
                    id: 'sec-a',
                    parentSectionId: null,
                    orderIndex: 1,
                    depth: 0,
                    title: 'Input and output',
                    problems: [problem('p1', 'Sum of two numbers')]
                },
                {
                    id: 'sec-b',
                    parentSectionId: 'sec-a',
                    orderIndex: 1,
                    depth: 1,
                    title: 'Loops',
                    problems: [problem('p2', 'Print N times', { status: 'DRAFT' })]
                },
                {
                    id: 'sec-c',
                    parentSectionId: 'sec-b',
                    orderIndex: 1,
                    depth: 2,
                    title: 'Nested loops',
                    problems: [problem('p3', 'Star pattern')]
                },
                {
                    id: 'sec-d',
                    parentSectionId: 'sec-c',
                    orderIndex: 1,
                    depth: 3,
                    title: 'Pattern printing',
                    problems: [problem('p4', 'Diamond pattern')]
                },
                {
                    id: 'sec-e',
                    parentSectionId: null,
                    orderIndex: 2,
                    depth: 0,
                    title: 'Arrays',
                    problems: []
                }
            ]
        }
    ]
};

/** Steps arrive collapsed, so every test opens one first. */
const openTheStep = async () => {
    await screen.findByText('Learn the basics');
    fireEvent.click(screen.getByRole('button', { name: /Expand step 1, Learn the basics/i }));
};

describe('DsaSheetManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchAdminDsaSheets.mockResolvedValue({
            content: [SHEET],
            page: 0,
            size: 25,
            totalElements: 1,
            totalPages: 1,
            hasNext: false
        });
    });

    it('shows every grouping level, four deep, with its problems', async () => {
        render(<DsaSheetManager />);
        await openTheStep();

        // Sections arrive expanded, so everything under the step is visible in one click.
        expect(screen.getByText('Input and output')).toBeInTheDocument();
        expect(screen.getByText('Loops')).toBeInTheDocument();
        expect(screen.getByText('Nested loops')).toBeInTheDocument();
        expect(screen.getByText('Pattern printing')).toBeInTheDocument();
        expect(screen.getByText('Arrays')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Diamond pattern' })).toBeInTheDocument();
    });

    /**
     * The header of a section, read through its own rename button so the counts of a parent and
     * a child cannot be confused for each other.
     */
    const headerTextFor = (title: string) =>
        screen.getByRole('button', { name: `Rename ${title}` }).parentElement!.parentElement!
            .textContent ?? '';

    it('rolls problem counts up through every level of the subtree', async () => {
        render(<DsaSheetManager />);
        await openTheStep();

        // Each level counts itself plus everything below it, and the one draft sits at depth 1.
        expect(headerTextFor('Input and output')).toContain('4 problems · 1 draft');
        expect(headerTextFor('Loops')).toContain('3 problems · 1 draft');
        expect(headerTextFor('Nested loops')).toContain('2 problems');
        expect(headerTextFor('Pattern printing')).toContain('1 problem');
        expect(headerTextFor('Arrays')).toContain('0 problems');
    });

    it('renames a section inline without collapsing it', async () => {
        updateDsaSection.mockResolvedValue(undefined);
        render(<DsaSheetManager />);
        await openTheStep();

        fireEvent.click(screen.getByRole('button', { name: 'Rename Loops' }));
        const input = screen.getByRole('textbox', { name: 'Title' });
        fireEvent.change(input, { target: { value: 'Iteration' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => expect(updateDsaSection).toHaveBeenCalledWith('sec-b', { title: 'Iteration' }));
        // Still open: the problem under it is on screen.
        expect(screen.getByRole('button', { name: 'Print N times' })).toBeInTheDocument();
    });

    it('names the right noun when confirming a section delete, and says what goes with it', async () => {
        render(<DsaSheetManager />);
        await openTheStep();

        fireEvent.click(screen.getByRole('button', { name: 'Delete section Nested loops' }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('Delete section?')).toBeInTheDocument();
        // Its own problem plus the fourth level's.
        expect(within(dialog).getByText(/2 problems/)).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: /Delete section/ }));
        await waitFor(() => expect(deleteDsaSection).toHaveBeenCalledWith('sec-c'));
    });

    it('confirms a problem delete as a problem, not as a course', async () => {
        render(<DsaSheetManager />);
        await openTheStep();

        fireEvent.click(screen.getByRole('button', { name: 'Delete Star pattern' }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('Delete problem?')).toBeInTheDocument();
        expect(within(dialog).queryByText(/course/i)).not.toBeInTheDocument();
    });

    it('opens the editor for the problem whose title was clicked', async () => {
        render(<DsaSheetManager />);
        await openTheStep();

        fireEvent.click(screen.getByRole('button', { name: 'Star pattern' }));
        expect(await screen.findByTestId('editor-modal')).toHaveTextContent('p3');
    });

    it('does not collapse a section when a control in its header is clicked', async () => {
        render(<DsaSheetManager />);
        await openTheStep();

        // Arrays is empty, so its body is this one line — visible only while it is open.
        expect(screen.getByText('Nothing in this section yet.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Rename Arrays' }));

        expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Arrays');
        expect(screen.getByText('Nothing in this section yet.')).toBeInTheDocument();
    });
});
