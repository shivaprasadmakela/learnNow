import React, { useEffect, useState } from 'react';
import { Check, Compass, Route } from 'lucide-react';
import styles from '../styles/Tracks.module.css';
import { ContentHeroBanner } from '../../../shared/components/ui/ContentHeroBanner';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Loader } from '../../../shared/components/ui/Loader';
import { formatStudyTime } from '../../../shared/utils/studyTime';
import { fetchTrack, type NextLesson, type TrackDetail } from '../api/tracks.api';

export interface TrackPageProps {
    slug: string;
    isLoggedIn: boolean;
    onOpenPath: (pathId: string, pathTitle: string) => void;
    onContinue: (lesson: NextLesson) => void;
    onRequireLogin: () => void;
    onBackToPaths: () => void;
    /** Hands the loaded title up, for the breadcrumb. */
    onTitleLoaded?: (title: string) => void;
}

type LoadState =
    | { status: 'loading' }
    | { status: 'missing' }
    | { status: 'failed' }
    | { status: 'ready'; track: TrackDetail };

/**
 * One career track as a roadmap: its paths in order, each with the learner's progress, and a
 * button that opens the first lesson they have not finished - so following a track is a matter of
 * pressing Continue rather than working out where they were.
 */
export const TrackPage: React.FC<TrackPageProps> = ({
    slug,
    isLoggedIn,
    onOpenPath,
    onContinue,
    onRequireLogin,
    onBackToPaths,
    onTitleLoaded
}) => {
    const [state, setState] = useState<LoadState>({ status: 'loading' });

    // The parent keys this page by slug, so a different track starts again from "loading". A
    // refetch after signing in keeps the roadmap on screen until the new one arrives.
    useEffect(() => {
        let cancelled = false;
        fetchTrack(slug)
            .then(track => {
                if (cancelled) return;
                setState({ status: 'ready', track });
                onTitleLoaded?.(track.title);
            })
            .catch((err: { status?: number }) => {
                if (!cancelled) setState({ status: err?.status === 404 ? 'missing' : 'failed' });
            });
        return () => {
            cancelled = true;
        };
        // Signing in or out changes what the server returns - progress, and the next lesson.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, isLoggedIn]);

    if (state.status === 'loading') {
        return (
            <div className={styles.trackPageLoading}>
                <Loader variant="inline" text="Loading track..." />
            </div>
        );
    }

    if (state.status !== 'ready') {
        return (
            <EmptyState
                icon={Compass}
                title={state.status === 'missing' ? 'Track not found' : 'Could not load this track'}
                description={
                    state.status === 'missing'
                        ? 'This career track does not exist, or is no longer published.'
                        : 'Something went wrong loading the track. Try again in a moment.'
                }
                actionLabel="Browse paths"
                onAction={onBackToPaths}
            />
        );
    }

    const { track } = state;
    const required = track.steps.filter(s => !s.optional);
    const time = formatStudyTime(track.estimatedMinutes);
    const optionalTime = formatStudyTime(track.optionalMinutes);
    const progress = track.progressPercentage ?? 0;
    const finished = isLoggedIn && track.nextLesson === null && progress >= 100;

    const meta = [
        `${required.length} ${required.length === 1 ? 'path' : 'paths'}`,
        ...(time ? [time] : []),
        ...(optionalTime ? [`+ ${optionalTime} optional`] : [])
    ];

    let actionLabel: string | undefined;
    let onAction: (() => void) | undefined;
    if (!isLoggedIn) {
        // Starting needs an account; the button says what it does next, the login page explains why.
        actionLabel = 'Start track';
        onAction = onRequireLogin;
    } else if (track.nextLesson) {
        const lesson = track.nextLesson;
        actionLabel = progress > 0 ? 'Continue' : 'Start track';
        onAction = () => onContinue(lesson);
    }

    return (
        <div className={styles.trackPage}>
            <ContentHeroBanner
                badgeLabel="Career track"
                badgeIcon={<Route size={14} aria-hidden="true" />}
                title={track.title}
                description={track.description}
                meta={meta}
                progressPercent={progress}
                progressLabel={finished ? 'Track complete' : 'Track progress'}
                actionLabel={actionLabel}
                onAction={onAction}
                footer={
                    isLoggedIn && track.nextLesson ? (
                        <p className={styles.upNext}>
                            <span className={styles.upNextLabel}>Up next</span>
                            {track.nextLesson.subtopicTitle}
                            <span className={styles.upNextWhere}>
                                {' '}
                                · {track.nextLesson.topicTitle} · {track.nextLesson.pathTitle}
                            </span>
                        </p>
                    ) : undefined
                }
            />

            <h2 className={styles.roadmapTitle}>The route</h2>
            <ol className={styles.roadmap}>
                {track.steps.map(step => {
                    const pct = step.progressPercentage;
                    const done = typeof pct === 'number' && pct >= 100;
                    const stepTime = formatStudyTime(step.estimatedMinutes);
                    const facts = [
                        step.category,
                        `${step.topicCount} ${step.topicCount === 1 ? 'topic' : 'topics'}`,
                        stepTime
                    ].filter(Boolean);
                    return (
                        <li
                            key={step.pathId}
                            className={`${styles.roadmapStep} ${step.optional ? styles.roadmapStepOptional : ''}`.trim()}
                        >
                            <span
                                className={`${styles.stepMarker} ${done ? styles.stepMarkerDone : ''}`.trim()}
                                aria-hidden="true"
                            >
                                {done ? <Check size={16} /> : step.stepNumber}
                            </span>
                            <div className={styles.stepCard}>
                                <div className={styles.stepHeading}>
                                    <h3 className={styles.stepTitle}>
                                        <button
                                            type="button"
                                            className={styles.stepTitleButton}
                                            onClick={() => onOpenPath(step.pathId, step.title)}
                                        >
                                            <span className={styles.visuallyHidden}>
                                                Step {step.stepNumber}
                                                {done ? ', completed' : ''}:{' '}
                                            </span>
                                            {step.title}
                                        </button>
                                    </h3>
                                    {step.optional && <span className={styles.optionalPill}>Optional</span>}
                                </div>
                                <p className={styles.stepFacts}>{facts.join(' · ')}</p>
                                {step.note && <p className={styles.stepNote}>{step.note}</p>}
                                {isLoggedIn && typeof pct === 'number' && (
                                    <div className={styles.cardProgress}>
                                        <div
                                            className={styles.progressTrack}
                                            role="progressbar"
                                            aria-valuenow={pct}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`${step.title} progress`}
                                        >
                                            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className={styles.progressText}>{pct}%</span>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

export default TrackPage;
