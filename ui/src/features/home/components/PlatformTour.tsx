import React, { useCallback, useEffect, useState } from 'react';
import { Flame, Trophy, Route, Gauge, Compass } from 'lucide-react';
import { useInView, usePrefersReducedMotion } from '../../../shared/hooks';
import { ProgressRing } from '../../../shared/components';
import { LearningCard } from '../../../shared/components/cards';
import { StreakCalendar } from '../../dashboard/components/StreakCalendar';
import { WeeklyLeagueBoard } from '../../dashboard/components/WeeklyLeagueBoard';
import { DEMO_LEADERBOARD, DEMO_WEEKLY_CALENDAR } from '../demoData';
import styles from '../styles/Home.module.css';

type TourId = 'streak' | 'league' | 'paths' | 'progress';

interface TourItem {
    id: TourId;
    icon: React.ReactNode;
    title: string;
    body: string;
    /** What the preview is, in the visitor's words. Sits above the live component. */
    previewLabel: string;
}

/**
 * How long one panel holds before the tour moves on, in milliseconds.
 *
 * Long enough to read the body text without feeling parked. The progress bar under the active
 * item is driven by a CSS animation of the same duration, so the two are kept in step by this
 * constant on both sides — see --tour-step-duration in Home.module.css.
 */
const STEP_MS = 7000;

const TOUR_ITEMS: TourItem[] = [
    {
        id: 'streak',
        icon: <Flame size={18} />,
        title: 'A streak that survives a real week',
        body: 'One topic a day is the whole commitment. The calendar shows the week you actually had, not a guilt trip about the one you planned.',
        previewLabel: 'Your week, on the dashboard'
    },
    {
        id: 'league',
        icon: <Trophy size={18} />,
        title: 'A league that resets every Monday',
        body: 'Points come from finishing topics, not from logging in. Everyone starts level on Monday, so a bad week never follows you around.',
        previewLabel: 'This week’s league table'
    },
    {
        id: 'paths',
        icon: <Route size={18} />,
        title: 'Paths, not playlists',
        body: 'Each track is an ordered route through a real architecture — Spring Boot, React, PostgreSQL — with the next step always picked for you.',
        previewLabel: 'A path, mid-flight'
    },
    {
        id: 'progress',
        icon: <Gauge size={18} />,
        title: 'Progress you can actually see',
        body: 'Every topic you finish moves a number you can point at. No vanity metrics, no percentage that only ever goes up by standing still.',
        previewLabel: 'Where you stand, per track'
    }
];

const TourPreview: React.FC<{ id: TourId }> = ({ id }) => {
    switch (id) {
        case 'streak':
            return <StreakCalendar currentStreak={7} weeklyCalendar={DEMO_WEEKLY_CALENDAR} />;
        case 'league':
            return <WeeklyLeagueBoard entries={DEMO_LEADERBOARD} />;
        case 'paths':
            return (
                <LearningCard
                    badgeLabel="Backend Engineering"
                    title="Spring Boot & Java 21 Monolith"
                    description="Build high-performance REST APIs, JPA entities, Flyway migrations & JWT auth."
                    footerText="5 / 8 Topics Completed"
                    progressPercentage={68}
                    showProgress
                />
            );
        case 'progress':
            return (
                <div className={styles.tourRings}>
                    <ProgressRing percentage={68} size={112} strokeWidth={9} label="68%" sublabel="Backend" />
                    <ProgressRing percentage={45} size={112} strokeWidth={9} label="45%" sublabel="Fullstack" />
                    <ProgressRing percentage={30} size={112} strokeWidth={9} label="30%" sublabel="Database" />
                </div>
            );
    }
};

/**
 * The part of the page you can play with.
 *
 * Every preview is the component the portal itself renders — the same StreakCalendar, the same
 * league board, the same card. That is deliberate: a landing page built out of screenshots starts
 * lying the first time the product changes, and this one cannot, because it *is* the product.
 *
 * It advances on its own so the page is never inert for a visitor who only scrolls, but stops the
 * moment anyone takes hold of it: a hover pauses, a click hands over control for good. Autoplay
 * that keeps yanking the panel away from someone reading it is worse than no autoplay.
 */
export const PlatformTour: React.FC = () => {
    const [activeId, setActiveId] = useState<TourId>('streak');
    const [autoPlay, setAutoPlay] = useState(true);
    const [paused, setPaused] = useState(false);
    const prefersReducedMotion = usePrefersReducedMotion();

    // once: false — the tour should stop advancing again when it scrolls back off screen, not
    // keep cycling through panels nobody is looking at.
    const [ref, inView] = useInView<HTMLElement>({ once: false, threshold: 0.3 });

    const running = autoPlay && inView && !paused && !prefersReducedMotion;

    useEffect(() => {
        if (!running) return;
        const timer = window.setInterval(() => {
            setActiveId(current => {
                const index = TOUR_ITEMS.findIndex(item => item.id === current);
                return TOUR_ITEMS[(index + 1) % TOUR_ITEMS.length].id;
            });
        }, STEP_MS);
        return () => window.clearInterval(timer);
    }, [running]);

    const select = useCallback((id: TourId) => {
        setActiveId(id);
        setAutoPlay(false);
    }, []);

    const active = TOUR_ITEMS.find(item => item.id === activeId) ?? TOUR_ITEMS[0];

    return (
        <section
            ref={ref}
            className={styles.tourSection}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className={styles.tourIntro}>
                <div className={styles.sectionBadge}>
                    <Compass size={14} /> Take a look around
                </div>
                <h2 className={styles.catalogTitle}>The platform, not a screenshot of it</h2>
                <p className={styles.catalogSubtitle}>
                    Everything below is the real interface. Pick a panel — it stops moving the moment you do.
                </p>
            </div>

            <div className={styles.tourLayout}>
                <div className={styles.tourList} role="tablist" aria-label="Platform features">
                    {TOUR_ITEMS.map(item => {
                        const isActive = item.id === activeId;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                id={`tour-tab-${item.id}`}
                                aria-selected={isActive}
                                aria-controls="tour-panel"
                                className={`${styles.tourItem} ${isActive ? styles.tourItemActive : ''}`}
                                onClick={() => select(item.id)}
                                onFocus={() => select(item.id)}
                            >
                                <span className={styles.tourItemIcon}>{item.icon}</span>
                                <span className={styles.tourItemText}>
                                    <span className={styles.tourItemTitle}>{item.title}</span>
                                    <span className={styles.tourItemBody}>{item.body}</span>
                                </span>
                                {/*
                                  * The countdown to the next panel. Keyed on activeId so the CSS
                                  * animation restarts from zero each time rather than resuming
                                  * mid-sweep, and only rendered while the tour is actually
                                  * advancing — a bar that fills while nothing happens is a lie.
                                  */}
                                {isActive && running && (
                                    <span key={activeId} className={styles.tourItemTimer} aria-hidden="true" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div
                    className={styles.tourStage}
                    id="tour-panel"
                    role="tabpanel"
                    aria-labelledby={`tour-tab-${activeId}`}
                >
                    <div className={styles.tourStageLabel}>{active.previewLabel}</div>
                    {/* Keyed so a change swaps the panel and replays the entry animation. */}
                    <div key={activeId} className={styles.tourStageBody}>
                        <TourPreview id={activeId} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PlatformTour;
