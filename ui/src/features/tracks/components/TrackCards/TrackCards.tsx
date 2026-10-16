import React from 'react';
import { ArrowRight, Route } from 'lucide-react';
import styles from '../../styles/Tracks.module.css';
import { formatStudyTime } from '../../../../shared/utils/studyTime';
import type { TrackSummary } from '../../api/tracks.api';

export interface TrackCardsProps {
    tracks: TrackSummary[];
    onSelectTrack: (slug: string) => void;
}

/**
 * Career tracks above the path grid: one card per route, with its steps spelled out so the card
 * says what "Java Full Stack Developer" actually involves before anyone opens it.
 *
 * The title is the card's only control and its click area is stretched over the whole card. A
 * button wrapping the card instead could not hold the step list - a list is not allowed inside a
 * button - and would read the entire card out as its name.
 */
export const TrackCards: React.FC<TrackCardsProps> = ({ tracks, onSelectTrack }) => {
    if (tracks.length === 0) return null;

    return (
        <section className={styles.tracksSection} aria-labelledby="career-tracks-heading">
            <div className={styles.sectionHeader}>
                <h2 id="career-tracks-heading" className={styles.sectionTitle}>
                    Career tracks
                </h2>
                <p className={styles.sectionSubtitle}>
                    Follow a whole route to a role, in order, instead of choosing paths one at a time.
                </p>
            </div>

            <div className={styles.trackGrid}>
                {tracks.map(track => {
                    const required = track.stepCount - track.optionalStepCount;
                    const time = formatStudyTime(track.estimatedMinutes);
                    const progress = track.progressPercentage;
                    return (
                        <article key={track.slug} className={styles.trackCard}>
                            <span className={styles.trackBadge}>
                                <Route size={14} aria-hidden="true" />
                                Track
                            </span>
                            <h3 className={styles.trackTitle}>
                                <button
                                    type="button"
                                    className={styles.trackTitleButton}
                                    onClick={() => onSelectTrack(track.slug)}
                                >
                                    {track.title}
                                </button>
                            </h3>
                            {track.description && (
                                <p className={styles.trackDescription}>{track.description}</p>
                            )}

                            <ol className={styles.routePreview} aria-label={`${track.title} steps`}>
                                {track.steps.map(step => (
                                    <li
                                        key={step.pathId}
                                        className={step.optional ? styles.routeStepOptional : styles.routeStep}
                                    >
                                        {step.title}
                                        {step.optional && <span className={styles.visuallyHidden}> (optional)</span>}
                                    </li>
                                ))}
                            </ol>

                            {typeof progress === 'number' && progress > 0 ? (
                                <div className={styles.cardProgress}>
                                    <div
                                        className={styles.progressTrack}
                                        role="progressbar"
                                        aria-valuenow={progress}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${track.title} progress`}
                                    >
                                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className={styles.progressText}>{progress}%</span>
                                </div>
                            ) : (
                                <div className={styles.trackFooter}>
                                    <span>
                                        {required} {required === 1 ? 'path' : 'paths'}
                                        {time ? ` · ${time}` : ''}
                                    </span>
                                    <ArrowRight size={16} aria-hidden="true" className={styles.trackArrow} />
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default TrackCards;
