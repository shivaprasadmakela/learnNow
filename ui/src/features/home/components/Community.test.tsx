import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Community } from './Community';

/**
 * The landing page's animated statistics.
 *
 * Worth a test because the failure mode is silent and permanent: if the counter never starts, the
 * section still renders, still looks finished, and simply claims the platform has zero engineers.
 * Nothing throws and nothing logs.
 *
 * jsdom has no IntersectionObserver, which is the case useInView is built to survive — with no
 * observer it reports the element as visible immediately rather than waiting for an event that
 * will never arrive. So this also covers that fallback: the numbers arriving at all is the proof
 * the hook did not simply give up.
 */
describe('Community statistics', () => {
    it('counts up to the real figures once the section is treated as visible', async () => {
        render(<Community onSelectCourse={() => {}} />);

        await waitFor(
            () => {
                expect(screen.getByText('5,000+')).toBeInTheDocument();
                expect(screen.getByText('120+')).toBeInTheDocument();
                expect(screen.getByText('98%')).toBeInTheDocument();
            },
            { timeout: 4000 }
        );
    });

    it('describes the architecture layer the visitor selects', async () => {
        render(<Community onSelectCourse={() => {}} />);

        // The first layer explains itself without being asked, so the panel is never empty.
        expect(screen.getByText(/Feature-first modules/)).toBeInTheDocument();

        screen.getByRole('button', { name: /PostgreSQL \+ Flyway Schema/ }).click();

        await waitFor(() =>
            expect(screen.getByText(/versioned migration/)).toBeInTheDocument()
        );
    });
});
