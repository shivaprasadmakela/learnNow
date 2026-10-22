import { apiFetchJson } from '../../../shared/api/client';
import type { NextLesson } from '../../../types';

export type { NextLesson };

/**
 * Career tracks: ordered routes through existing paths.
 *
 * Ids are strings - the backend issues UUIDs. Progress fields are null for a visitor who is not
 * signed in; the same endpoints serve both, and the token on a signed-in request is what adds them.
 */

export interface TrackStepRef {
    pathId: string;
    title: string;
    optional: boolean;
}

export interface TrackSummary {
    slug: string;
    title: string;
    description?: string;
    stepCount: number;
    optionalStepCount: number;
    topicCount: number;
    /** Required steps only: the time it takes to finish the track. */
    estimatedMinutes: number;
    /** What the optional steps add on top. */
    optionalMinutes: number;
    progressPercentage: number | null;
    steps: TrackStepRef[];
}

export interface TrackStep {
    stepNumber: number;
    pathId: string;
    title: string;
    description?: string;
    category?: string;
    optional: boolean;
    note?: string;
    topicCount: number;
    estimatedMinutes: number;
    progressPercentage: number | null;
}

export interface TrackDetail {
    slug: string;
    title: string;
    description?: string;
    estimatedMinutes: number;
    optionalMinutes: number;
    progressPercentage: number | null;
    steps: TrackStep[];
    /** Null for a visitor, and once every step is finished. */
    nextLesson: NextLesson | null;
}

export const fetchTracks = (): Promise<TrackSummary[]> =>
    apiFetchJson<TrackSummary[]>('/api/catalog/tracks');

export const fetchTrack = (slug: string): Promise<TrackDetail> =>
    apiFetchJson<TrackDetail>(`/api/catalog/tracks/${encodeURIComponent(slug)}`);
