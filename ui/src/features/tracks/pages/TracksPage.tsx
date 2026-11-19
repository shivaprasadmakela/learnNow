import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import styles from '../styles/Tracks.module.css';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Loader } from '../../../shared/components/ui/Loader';
import { TrackCards } from '../components/TrackCards/TrackCards';
import { fetchTracks, type TrackSummary } from '../api/tracks.api';

export interface TracksPageProps {
    isLoggedIn: boolean;
    onSelectTrack: (slug: string) => void;
    onBackToPaths: () => void;
}

type State =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; tracks: TrackSummary[] };

/**
 * Every career track. The Paths page shows the first few, so a growing list of tracks does not push
 * the paths themselves out of sight; this is where the rest live.
 */
export const TracksPage: React.FC<TracksPageProps> = ({ isLoggedIn, onSelectTrack, onBackToPaths }) => {
    const [state, setState] = useState<State>({ status: 'loading' });

    // Signing in or out changes the progress shown on each card.
    useEffect(() => {
        let cancelled = false;
        fetchTracks()
            .then(tracks => {
                if (!cancelled) setState({ status: 'ready', tracks });
            })
            .catch(err => {
                console.error('Failed to load career tracks', err);
                if (!cancelled) setState({ status: 'error' });
            });
        return () => {
            cancelled = true;
        };
    }, [isLoggedIn]);

    if (state.status === 'loading') {
        return (
            <div className={styles.trackPageLoading}>
                <Loader variant="inline" text="Loading career tracks..." />
            </div>
        );
    }

    if (state.status === 'error' || state.tracks.length === 0) {
        return (
            <EmptyState
                icon={Compass}
                title={state.status === 'error' ? 'Could not load the career tracks' : 'No career tracks yet'}
                description={
                    state.status === 'error'
                        ? 'Something went wrong loading the tracks. Try again in a moment.'
                        : 'Career tracks will appear here once they are published.'
                }
                actionLabel="Browse paths"
                onAction={onBackToPaths}
            />
        );
    }

    return (
        <div className={styles.tracksPage}>
            <header className={styles.tracksPageHeader}>
                <h1 className={styles.tracksPageTitle}>Career tracks</h1>
                <p className={styles.sectionSubtitle}>
                    Follow a whole route to a role, in order, instead of choosing paths one at a time.
                </p>
            </header>
            <TrackCards tracks={state.tracks} onSelectTrack={onSelectTrack} hideHeader />
        </div>
    );
};

export default TracksPage;
