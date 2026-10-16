import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrackPage } from './TrackPage';
import { fetchTrack, type TrackDetail } from '../api/tracks.api';
import { ApiError } from '../../../shared/api/client';

vi.mock('../api/tracks.api', () => ({ fetchTrack: vi.fn() }));

const track = (overrides: Partial<TrackDetail> = {}): TrackDetail => ({
    slug: 'java-full-stack-developer',
    title: 'Java Full Stack Developer',
    description: 'From Java to a deployed web app.',
    estimatedMinutes: 600,
    optionalMinutes: 120,
    progressPercentage: 40,
    steps: [
        {
            stepNumber: 1, pathId: 'p-java', title: 'Core Java', category: 'Backend', optional: false,
            note: 'The language.', topicCount: 21, estimatedMinutes: 480, progressPercentage: 100
        },
        {
            stepNumber: 2, pathId: 'p-sql', title: 'SQL and Databases', category: 'Data', optional: false,
            topicCount: 9, estimatedMinutes: 120, progressPercentage: 10
        },
        {
            stepNumber: 3, pathId: 'p-sd', title: 'System Design', category: 'Backend', optional: true,
            topicCount: 16, estimatedMinutes: 120, progressPercentage: 0
        }
    ],
    nextLesson: {
        pathId: 'p-sql', pathTitle: 'SQL and Databases', topicId: 't-1', topicTitle: 'Getting Data Out',
        subtopicId: 's-2', subtopicTitle: 'Keeping only the rows you want'
    },
    ...overrides
});

const props = () => ({
    slug: 'java-full-stack-developer',
    isLoggedIn: true,
    onOpenPath: vi.fn(),
    onContinue: vi.fn(),
    onRequireLogin: vi.fn(),
    onBackToPaths: vi.fn()
});

/**
 * The roadmap's job is to make following a track one button: Continue must open exactly the lesson
 * the server named, and every step must open its own path.
 */
describe('TrackPage', () => {
    // A block body, not an arrow returning the mock: Vitest runs a function returned from
    // beforeEach as cleanup, which would call fetchTrack once more after every test.
    beforeEach(() => {
        vi.mocked(fetchTrack).mockReset();
    });

    it('lists the steps in order, marking the finished and the optional ones', async () => {
        vi.mocked(fetchTrack).mockResolvedValue(track());
        render(<TrackPage {...props()} />);

        const steps = await screen.findAllByRole('button', { name: /^Step \d/ });
        expect(steps.map(s => s.textContent)).toEqual([
            'Step 1, completed: Core Java',
            'Step 2: SQL and Databases',
            'Step 3: System Design'
        ]);
        expect(screen.getByText('Optional')).toBeInTheDocument();
        expect(screen.getByText('10 hours')).toBeInTheDocument();
        expect(screen.getByText('+ 2 hours optional')).toBeInTheDocument();
    });

    it('continues from the lesson the server says is next', async () => {
        const p = props();
        vi.mocked(fetchTrack).mockResolvedValue(track());
        render(<TrackPage {...p} />);

        fireEvent.click(await screen.findByRole('button', { name: /Continue/ }));

        expect(p.onContinue).toHaveBeenCalledWith(track().nextLesson);
        expect(screen.getByText('Keeping only the rows you want')).toBeInTheDocument();
    });

    it("opens a step's path with its id and title", async () => {
        const p = props();
        vi.mocked(fetchTrack).mockResolvedValue(track());
        render(<TrackPage {...p} />);

        fireEvent.click(await screen.findByRole('button', { name: /SQL and Databases/ }));

        expect(p.onOpenPath).toHaveBeenCalledWith('p-sql', 'SQL and Databases');
    });

    it('sends a visitor who starts the track to log in', async () => {
        const p = { ...props(), isLoggedIn: false };
        vi.mocked(fetchTrack).mockResolvedValue(
            track({
                progressPercentage: null,
                nextLesson: null,
                steps: track().steps.map(s => ({ ...s, progressPercentage: null }))
            })
        );
        render(<TrackPage {...p} />);

        fireEvent.click(await screen.findByRole('button', { name: /Start track/ }));

        expect(p.onRequireLogin).toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: /Continue/ })).not.toBeInTheDocument();
    });

    it('says so when the track does not exist', async () => {
        vi.mocked(fetchTrack).mockRejectedValue(new ApiError('Not found', 404, null));
        render(<TrackPage {...props()} />);

        expect(await screen.findByText('Track not found')).toBeInTheDocument();
    });
});
