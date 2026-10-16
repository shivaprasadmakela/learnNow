import { useEffect, useState } from 'react';
import { fetchTracks, type TrackSummary } from '../api/tracks.api';

/**
 * The career tracks a path is a step of, for linking from the path back to its routes. Empty
 * until loaded, and empty on failure - the links are a convenience, not something to report.
 */
export const useTracksContainingPath = (pathId: string | number | undefined): TrackSummary[] => {
    const [tracks, setTracks] = useState<TrackSummary[]>([]);
    const key = pathId === undefined || pathId === null ? '' : String(pathId);

    useEffect(() => {
        if (!key) return;
        let cancelled = false;
        fetchTracks()
            .then(all => {
                if (cancelled) return;
                setTracks(all.filter(track => track.steps.some(step => step.pathId === key)));
            })
            .catch(() => {
                if (!cancelled) setTracks([]);
            });
        return () => {
            cancelled = true;
        };
    }, [key]);

    return key ? tracks : [];
};
