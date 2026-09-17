import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DsaProblemEditorModal } from './DsaProblemEditorModal';
import type { AdminDsaProblem } from '../../../dsa/api/adminDsa.api';

const fetchAdminDsaProblem = vi.fn();
const updateDsaProblem = vi.fn();

vi.mock('../../../dsa/api/adminDsa.api', () => ({
    fetchAdminDsaProblem: (...args: unknown[]) => fetchAdminDsaProblem(...args),
    updateDsaProblem: (...args: unknown[]) => updateDsaProblem(...args)
}));

/** The real workspace drags in Monaco and the judge; what matters here is what it is handed. */
vi.mock('../../../dsa', () => ({
    DsaProblemPage: ({ previewProblemId }: { previewProblemId?: string }) => (
        <div data-testid="workspace">{previewProblemId}</div>
    )
}));

vi.mock('../../../../shared/components/editor', () => ({
    MonacoEditorPane: ({ code, onChange }: { code: string; onChange: (v: string) => void }) => (
        <textarea data-testid="monaco" value={code} onChange={e => onChange(e.target.value)} />
    )
}));

const PROBLEM: AdminDsaProblem = {
    id: 'p1',
    slug: 'sum-two-numbers',
    title: 'Sum of two numbers',
    statement: 'Add **a** and **b**.',
    difficulty: 'EASY',
    tags: ['math', 'basics'],
    estimatedMinutes: 5,
    youtubeUrl: undefined,
    youtubePosition: undefined,
    practiceUrl: undefined,
    practicePlatform: undefined,
    status: 'DRAFT',
    sectionId: 'sec-a',
    orderIndex: 1,
    approaches: [
        {
            id: 'a1',
            kind: 'OPTIMAL',
            orderIndex: 1,
            intuition: 'Add them.',
            timeComplexity: 'O(1)',
            spaceComplexity: 'O(1)',
            language: 'cpp',
            code: 'return a + b;'
        }
    ],
    hints: [
        { id: 'h1', orderIndex: 1, body: 'Read both numbers.' },
        { id: 'h2', orderIndex: 2, body: 'Use +.' }
    ],
    harnesses: [
        {
            id: 'hn1',
            language: 'cpp',
            starterCode: 'int solve(int a,int b){}',
            driverCode: '{{USER_CODE}}\nint main(){}',
            referenceSolution: 'int solve(int a,int b){return a+b;}'
        }
    ],
    testCases: [
        { id: 't1', orderIndex: 1, input: '1 2', expectedOutput: '3', sample: true, explanation: 'Sum.' },
        { id: 't2', orderIndex: 2, input: '4 5', expectedOutput: '9', sample: false }
    ],
    checks: [
        {
            id: 'c1',
            orderIndex: 1,
            prompt: 'Complexity?',
            options: ['O(1)', 'O(n)'],
            correctAnswer: 'O(1)',
            explanation: 'One addition.',
            points: 2
        }
    ]
};

const openTab = (name: RegExp) => fireEvent.click(screen.getByRole('tab', { name }));

const renderOpen = async () => {
    const onSaved = vi.fn();
    render(<DsaProblemEditorModal problemId="p1" onClose={vi.fn()} onSaved={onSaved} />);
    await screen.findByTestId('workspace');
    return { onSaved };
};

describe('DsaProblemEditorModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchAdminDsaProblem.mockResolvedValue(PROBLEM);
        updateDsaProblem.mockImplementation(async () => PROBLEM);
    });

    it('stays closed when there is no problem', () => {
        render(<DsaProblemEditorModal problemId={null} onClose={vi.fn()} onSaved={vi.fn()} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    /**
     * The preview is the learner workspace pointed at the authoring endpoint. If this ever
     * regresses to a slug, drafts stop previewing — which is the only case that needs it.
     */
    it('opens on the preview, rendering the real workspace by problem id', async () => {
        await renderOpen();
        expect(screen.getByTestId('workspace')).toHaveTextContent('p1');
    });

    it('does not offer to save until something changes', async () => {
        await renderOpen();
        expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();

        openTab(/Details/);
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Sum of two ints' } });

        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save/ })).toBeEnabled();
    });

    /** Undoing an edit has to clear the dirty state, or the dialog blocks its own backdrop forever. */
    it('stops claiming unsaved changes once an edit is reverted', async () => {
        await renderOpen();
        openTab(/Details/);

        const title = screen.getByLabelText('Title');
        fireEvent.change(title, { target: { value: 'Changed' } });
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

        fireEvent.change(title, { target: { value: 'Sum of two numbers' } });
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('sends every tab in one save, with the form shapes turned back into wire shapes', async () => {
        const { onSaved } = await renderOpen();

        openTab(/Details/);
        fireEvent.change(screen.getByLabelText('Tags'), {
            target: { value: 'math, arithmetic , basics' }
        });
        fireEvent.change(screen.getByLabelText('Difficulty'), { target: { value: 'MEDIUM' } });

        fireEvent.click(screen.getByRole('button', { name: /Save/ }));

        await waitFor(() => expect(updateDsaProblem).toHaveBeenCalledTimes(1));
        const [id, payload] = updateDsaProblem.mock.calls[0];

        expect(id).toBe('p1');
        expect(payload.difficulty).toBe('MEDIUM');
        // Trimmed and split, not sent as the raw string the author typed.
        expect(payload.tags).toEqual(['math', 'arithmetic', 'basics']);
        expect(payload.hints).toEqual(['Read both numbers.', 'Use +.']);
        expect(payload.testCases).toHaveLength(2);
        expect(payload.testCases[0]).toMatchObject({ input: '1 2', sample: true });
        expect(payload.harnesses[0].language).toBe('cpp');
        // Options are typed one per line and travel as an array.
        expect(payload.checks[0].options).toEqual(['O(1)', 'O(n)']);
        expect(onSaved).toHaveBeenCalled();
    });

    it('adds, reorders and removes hints', async () => {
        await renderOpen();
        openTab(/Hints/);

        fireEvent.click(screen.getByRole('button', { name: /Add a hint/ }));
        const fields = screen.getAllByLabelText('Hint');
        expect(fields).toHaveLength(3);

        fireEvent.change(fields[2], { target: { value: 'A third hint.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Move Hint 3 up' }));
        fireEvent.click(screen.getByRole('button', { name: 'Remove Hint 1' }));

        fireEvent.click(screen.getByRole('button', { name: /Save/ }));
        await waitFor(() => expect(updateDsaProblem).toHaveBeenCalled());
        expect(updateDsaProblem.mock.calls[0][1].hints).toEqual(['A third hint.', 'Use +.']);
    });

    /**
     * A driver without the placeholder produces a problem that compiles and judges nothing. The
     * server refuses it; catching it here means the author reads why instead of a 400.
     */
    it('blocks a save whose driver has lost the user-code placeholder', async () => {
        await renderOpen();
        openTab(/Harness/);

        const editors = screen.getAllByTestId('monaco');
        fireEvent.change(editors[1], { target: { value: 'int main(){}' } });

        expect(screen.getByText(/no \{\{USER_CODE\}\} placeholder/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    });

    it('blocks a save whose inline question cannot be answered correctly', async () => {
        await renderOpen();
        openTab(/Details/);

        fireEvent.change(screen.getByLabelText('Correct answer'), {
            target: { value: 'O(log n)' }
        });

        expect(screen.getByText(/not one of its options/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    });

    it('reseeds from the server response rather than from what it sent', async () => {
        updateDsaProblem.mockResolvedValue({ ...PROBLEM, title: 'Renamed by the server' });
        await renderOpen();
        openTab(/Details/);
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Something else' } });

        fireEvent.click(screen.getByRole('button', { name: /Save/ }));

        await waitFor(() =>
            expect(screen.getByLabelText('Title')).toHaveValue('Renamed by the server')
        );
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
});
