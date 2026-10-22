import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DashboardHeader } from './DashboardHeader';
import type { DashboardBanner } from '../../types';

const lesson = {
    pathId: 'p1',
    pathTitle: 'Spring Boot and Web Development',
    topicId: 't1',
    topicTitle: 'Transactions',
    subtopicId: 's1',
    subtopicTitle: 'What causes a rollback'
};

const banner = (type: DashboardBanner['type'], overrides: Partial<DashboardBanner> = {}): DashboardBanner => ({
    type,
    pathId: 'p1',
    pathTitle: 'Spring Boot and Web Development',
    pathDescription: 'd',
    reason: 'The first step of the Java Full Stack Developer track.',
    nextLesson: lesson,
    ...overrides
});

/**
 * The card's button used to look a path up in a list the dashboard does not always load, and could
 * open the wrong path or none. It now opens the exact lesson the server named.
 */
describe('DashboardHeader', () => {
    it('says where you left off and opens that exact lesson', () => {
        const onOpenLesson = vi.fn();
        render(<DashboardHeader banner={banner('CONTINUE', { reason: null })} onOpenLesson={onOpenLesson} />);

        expect(screen.getByText('Continue where you left off')).toBeInTheDocument();
        expect(screen.getByText('What causes a rollback')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        expect(onOpenLesson).toHaveBeenCalledWith(lesson);
    });

    it.each([
        ['NEXT', 'Recommended next', 'Start path'],
        ['START', 'Start here', 'Start learning']
    ] as const)('labels a %s card "%s" with a "%s" button', (type, label, action) => {
        render(<DashboardHeader banner={banner(type)} onOpenLesson={vi.fn()} />);

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: action })).toBeInTheDocument();
    });

    it('offers no button once everything is finished', () => {
        render(
            <DashboardHeader
                banner={banner('DONE', { nextLesson: null, pathTitle: 'Every path finished' })}
                onOpenLesson={vi.fn()}
            />
        );

        expect(screen.getByText('All caught up')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
