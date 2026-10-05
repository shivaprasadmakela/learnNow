import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Coffee, Sun, Sunset, Moon, Check } from 'lucide-react';
import { usePrefersReducedMotion } from '../../../hooks';
import styles from './Loader.module.css';

/**
 * The stages of an actual cold start, with the time each one has finished by.
 *
 * <p>These are not invented. They were read off a real Cloud Run start of this service: the JVM
 * is up at 3.3s, Spring's context at 9.0s, the first database connection at 12.2s, Flyway at
 * 14.2s, Hibernate's model at 19.9s, the repositories at 23.6s and Tomcat accepting traffic at
 * 27.0s. So the stage on screen is roughly what the server is really doing, rather than a
 * decorative sequence timed to look busy.
 *
 * If startup time changes a lot, re-read it from the "Started BackendApplication in Xs" log line
 * and the timestamps around it, and update these. Being approximately right matters more than
 * being precise - the point is that the progress bar is honest about the shape of the wait.
 */
const COLD_START_STAGES: { until: number; label: string }[] = [
    { until: 3300, label: 'Starting the server container' },
    { until: 9000, label: 'Loading the application' },
    { until: 12200, label: 'Opening the database connection' },
    { until: 14200, label: 'Checking the schema version' },
    { until: 19900, label: 'Building the data model' },
    { until: 23600, label: 'Wiring up the API routes' },
    { until: 27000, label: 'Starting the web server' }
];

const EXPECTED_COLD_START_MS = COLD_START_STAGES[COLD_START_STAGES.length - 1].until;

/** Past this, the estimate has clearly missed and saying so is better than a stuck bar. */
const OVERRUN_MS = EXPECTED_COLD_START_MS + 8000;

/**
 * Readiness, asked rather than assumed.
 *
 * <p>The old code fetched '/api/health' - a path that does not exist, relative, so on the
 * deployed site it hit the static host rather than the API and could never have told anyone
 * anything. This is the endpoint that does exist, on the configured backend, and it is permitted
 * unauthenticated and CORS-enabled for the site's own origin, so the answer is real.
 */
const HEALTH_URL = `${import.meta.env.VITE_BACKEND_URL || ''}/actuator/health`;

export interface LoaderProps {
    variant?: 'fullScreen' | 'inline' | 'overlay';
    text?: string;
    showColdStartFunnyMessages?: boolean;
    minHeight?: string | number;
}

interface ColdStartConfig {
    gifUrl: string;
    title: string;
    message: string;
    badgeColor: string;
    accentColor: string;
    icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;
    subMessages: string[];
}

const getTimeBasedLoaderConfig = (): ColdStartConfig => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return {
            gifUrl: '/bouncer.gif',
            title: 'Morning Brew',
            message: 'Waking up the backend server... Let\'s bounce into action!',
            badgeColor: 'rgba(245, 158, 11, 0.15)',
            accentColor: '#f59e0b',
            icon: Coffee,
            subMessages: [
                'Brewing morning coffee for JVM...',
                'Stretching Java bytecode muscles...',
                'Powering up local cache structures...',
                'Ready to bounce into today\'s coding goals!'
            ]
        };
    } else if (hour >= 12 && hour < 17) {
        return {
            gifUrl: '/loading.gif',
            title: 'Afternoon Fuel',
            message: 'Waking up the backend server... Powering up for the afternoon!',
            badgeColor: 'rgba(59, 130, 246, 0.15)',
            accentColor: '#3b82f6',
            icon: Sun,
            subMessages: [
                'Injecting afternoon fuel...',
                'Stretching JVM heap memory...',
                'Establishing PostgreSQL handshake...',
                'Preparing compiler syntax highlight engines!'
            ]
        };
    } else if (hour >= 17 && hour < 22) {
        return {
            gifUrl: '/cat-crying.gif',
            title: 'Evening Shift',
            message: 'Waking up the backend server... Warming up for your evening study!',
            badgeColor: 'rgba(236, 72, 153, 0.15)',
            accentColor: '#ec4899',
            icon: Sunset,
            subMessages: [
                'Waking up the sleepy server instance...',
                'Even the cat is crying from this late grind...',
                'Polishing learning modules for tonight...',
                'Checking connection to database pools...'
            ]
        };
    } else {
        return {
            gifUrl: '/cat-crying.gif',
            title: 'Late Night Grind',
            message: 'Waking up the backend server... Burning the midnight oil!',
            badgeColor: 'rgba(124, 58, 237, 0.15)',
            accentColor: '#7c3aed',
            icon: Moon,
            subMessages: [
                'Powering up midnight server cells...',
                'Waking up sleepy database connections...',
                'Even the cat is crying to start this study session...',
                'Optimizing workspace for night owls...'
            ]
        };
    }
};

export const Loader: React.FC<LoaderProps> = ({
    variant = 'inline',
    text,
    showColdStartFunnyMessages = true,
    minHeight
}) => {
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [messageIndex, setMessageIndex] = useState<number>(0);
    /** Set once /actuator/health answers, which means the wait is now data, not startup. */
    const [serverReady, setServerReady] = useState<boolean>(false);
    const prefersReducedMotion = usePrefersReducedMotion();

    const loaderConfig = useMemo(() => getTimeBasedLoaderConfig(), []);

    const rotatingMessages = useMemo(() => {
        return [
            loaderConfig.message,
            ...loaderConfig.subMessages,
            'Spinning up GCP Cloud Run container instance...',
            'Server was taking a power nap. Stretching JVM bytecodes...',
            'Warming up PostgreSQL database connection pools...',
            'Casting compilation spells... Almost ready!',
            'Fetching latest learning modules & progress state...'
        ];
    }, [loaderConfig]);

    // Track elapsed loading time
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 500);
        }, 500);

        return () => clearInterval(timer);
    }, []);

    /*
     * Rotate the messages once the wait is long enough to be worth narrating.
     *
     * The gate is a boolean, not elapsedTime itself. With elapsedTime in the dependencies this
     * effect re-ran on every 500 ms tick, and its cleanup cleared the 3.5 s interval each time
     * before it could ever fire - so the message never actually changed. The rotation had been
     * dead for as long as the list has existed, which is why a 30 second wait showed one line.
     */
    const shouldRotateMessages = elapsedTime >= 2000 && showColdStartFunnyMessages;
    useEffect(() => {
        if (!shouldRotateMessages) return;

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % rotatingMessages.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [shouldRotateMessages, rotatingMessages.length]);

    /*
     * Ask the backend whether it is up yet, rather than inferring it from a clock.
     *
     * A cold start is the common reason this loader is on screen, and its length varies by
     * several seconds. Polling turns the last part of the bar from a guess into a fact: the
     * moment health answers, the server is up and whatever is still outstanding is the real
     * request, which is worth saying differently.
     *
     * Failures are deliberately silent and simply mean "not yet" - during startup the endpoint
     * refuses connections, and that is the expected case, not an error worth surfacing.
     */
    /*
     * Gated on a boolean, never on elapsedTime.
     *
     * elapsedTime changes twice a second, so depending on it re-runs this effect twice a second -
     * and the cleanup would flip `cancelled` before any in-flight response came back, discarding
     * the very answer it was waiting for. That is the same mistake that had silently killed the
     * message rotation above, and it is worth stating plainly: in this component, an effect that
     * owns a timer or a request must not depend on the clock it is racing.
     */
    const shouldPollHealth = elapsedTime >= 2500 && showColdStartFunnyMessages && !serverReady;

    useEffect(() => {
        if (!shouldPollHealth) return;

        let cancelled = false;
        const ask = () => {
            fetch(HEALTH_URL, { method: 'GET', cache: 'no-store' })
                .then(response => {
                    if (!cancelled && response.ok) setServerReady(true);
                })
                .catch(() => {
                    /* Still starting. During boot the endpoint refuses connections, so a failure
                       here is the expected case rather than something worth reporting. */
                });
        };

        ask();
        const interval = window.setInterval(ask, 2000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [shouldPollHealth]);

    const isColdStart = elapsedTime >= 2200 && showColdStartFunnyMessages;
    const QuoteIcon = loaderConfig.icon;

    const overrunning = elapsedTime > OVERRUN_MS && !serverReady;
    const currentStage =
        COLD_START_STAGES.find(stage => elapsedTime < stage.until) ??
        COLD_START_STAGES[COLD_START_STAGES.length - 1];

    /*
     * Capped below 100 on purpose. The bar tracks an estimate of server startup, and the request
     * is not finished until it is finished - a bar that sits full while nothing happens is the
     * single most irritating thing a loader can do. It only fills when the component unmounts,
     * which is to say when the data actually arrived.
     */
    const percent = serverReady
        ? 96
        : Math.min(95, Math.round((elapsedTime / EXPECTED_COLD_START_MS) * 95));

    const stageLabel = serverReady
        ? 'Server is awake - fetching your data'
        : overrunning
            ? 'Still waking up - this one is slower than usual'
            : currentStage.label;

    const seconds = Math.floor(elapsedTime / 1000);

    const containerClassName =
        variant === 'fullScreen'
            ? styles.loaderFullScreen
            : variant === 'overlay'
                ? styles.loaderOverlay
                : styles.loaderInline;

    return (
        <div
            className={containerClassName}
            style={minHeight ? { minHeight } : undefined}
            /*
             * The whole thing is one live region. Without this a screen reader announces nothing
             * at all for the twenty-odd seconds of a cold start, which is indistinguishable from
             * a page that has silently failed. "polite" so it waits for a pause rather than
             * interrupting, and the stage line below is the only part allowed to re-announce -
             * the rotating jokes would otherwise talk over everything every 3.5 seconds.
             */
            role="status"
            aria-busy="true"
            aria-live="polite"
        >
            {isColdStart ? (
                <div className={styles.gifLoaderContainer}>
                    <img
                        src={loaderConfig.gifUrl}
                        alt={loaderConfig.title}
                        className={styles.gifLoaderImage}
                    />
                </div>
            ) : (
                <div className={styles.spinnerContainer}>
                    <div
                        className={styles.spinnerRing}
                        style={{
                            borderTopColor: 'var(--tech-blue, #0b57d0)'
                        }}
                    />
                    <div className={styles.spinnerCenterIcon}>
                        <RefreshCw size={16} color="var(--tech-blue, #0b57d0)" />
                    </div>
                </div>
            )}

            <div className={styles.textContainer}>
                {isColdStart ? (
                    <>
                        <div
                            className={styles.titleBadge}
                            style={{
                                backgroundColor: loaderConfig.badgeColor,
                                borderColor: `${loaderConfig.accentColor}40`,
                                color: loaderConfig.accentColor
                            }}
                        >
                            <QuoteIcon size={12} color={loaderConfig.accentColor} />
                            <span>{loaderConfig.title}</span>
                        </div>
                        <p className={styles.messageText} aria-hidden="true">
                            {rotatingMessages[messageIndex]}
                        </p>

                        <div className={styles.progressBlock}>
                            <div className={styles.progressHeader}>
                                <span className={styles.stageLabel}>
                                    {serverReady && <Check size={13} className={styles.stageTick} />}
                                    {stageLabel}
                                </span>
                                <span className={styles.elapsed}>{seconds}s</span>
                            </div>

                            <div
                                className={styles.progressTrack}
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={percent}
                                aria-label="Server start-up progress"
                            >
                                <div
                                    className={`${styles.progressFill} ${
                                        prefersReducedMotion ? '' : styles.progressFillAnimated
                                    } ${serverReady ? styles.progressFillReady : ''}`}
                                    style={{
                                        width: `${percent}%`,
                                        backgroundColor: serverReady
                                            ? undefined
                                            : loaderConfig.accentColor
                                    }}
                                />
                            </div>
                        </div>

                        <p className={styles.subNotice}>
                            {serverReady
                                ? 'Almost there - the server is up and your data is on its way.'
                                : overrunning
                                    ? 'Still going. The instance sleeps when idle, so the first visit pays the start-up.'
                                    : 'Free-tier server instance is spinning up. Thanks for your patience!'}
                        </p>
                    </>
                ) : (
                    <p className={styles.messageText}>
                        {text || 'Loading...'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Loader;
