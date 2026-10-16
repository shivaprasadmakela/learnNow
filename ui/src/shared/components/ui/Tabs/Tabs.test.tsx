import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs } from './Tabs';

/**
 * The count after a tab's label is a separate span spaced by the flex gap. Without a text space
 * between them the accessible name runs the two together, so a screen reader says "Backend3".
 */
describe('Tabs', () => {
    it('keeps a space between the label and the count in the accessible name', () => {
        render(
            <Tabs
                items={[
                    { id: 'All', label: 'All', count: 8 },
                    { id: 'Backend', label: 'Backend', count: 3 }
                ]}
                activeId="All"
                onChange={() => {}}
            />
        );

        expect(screen.getByRole('tab', { name: 'Backend 3' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'All 8' })).toHaveAttribute('aria-selected', 'true');
    });

    it('names a tab without a count by its label alone', () => {
        render(<Tabs items={[{ id: 'a', label: 'Overview' }]} activeId="a" onChange={() => {}} />);

        expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    });
});
