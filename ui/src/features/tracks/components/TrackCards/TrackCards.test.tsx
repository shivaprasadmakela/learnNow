import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrackCards } from './TrackCards';
import type { TrackSummary } from '../../api/tracks.api';

const summary: TrackSummary = {
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    description: 'The browser, then React.',
    stepCount: 3,
    optionalStepCount: 1,
    topicCount: 32,
    estimatedMinutes: 1447,
    optionalMinutes: 568,
    progressPercentage: null,
    steps: [
        { pathId: 'a', title: 'Frontend Development', optional: false },
        { pathId: 'b', title: 'React in Depth', optional: false },
        { pathId: 'c', title: 'Software Architecture and Delivery', optional: true }
    ]
};

/**
 * The card is clickable everywhere, but only its title is the control - so a screen reader hears
 * "Frontend Developer, button", not the whole card read out as one button name.
 */
describe('TrackCards', () => {
    it('names the control by the title alone and opens the track', () => {
        const onSelectTrack = vi.fn();
        render(<TrackCards tracks={[summary]} onSelectTrack={onSelectTrack} />);

        fireEvent.click(screen.getByRole('button', { name: 'Frontend Developer' }));

        expect(onSelectTrack).toHaveBeenCalledWith('frontend-developer');
    });

    it('shows the route, required paths only in the count, and marks the optional step', () => {
        render(<TrackCards tracks={[summary]} onSelectTrack={vi.fn()} />);

        expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual([
            'Frontend Development',
            'React in Depth',
            'Software Architecture and Delivery (optional)'
        ]);
        expect(screen.getByText('2 paths · 24 hours')).toBeInTheDocument();
    });

    it('shows progress instead of the time once a signed-in learner has started', () => {
        render(<TrackCards tracks={[{ ...summary, progressPercentage: 35 }]} onSelectTrack={vi.fn()} />);

        expect(screen.getByRole('progressbar', { name: 'Frontend Developer progress' })).toHaveAttribute(
            'aria-valuenow',
            '35'
        );
        expect(screen.queryByText(/2 paths/)).not.toBeInTheDocument();
    });

    it('renders nothing when there are no tracks', () => {
        const { container } = render(<TrackCards tracks={[]} onSelectTrack={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });
});
