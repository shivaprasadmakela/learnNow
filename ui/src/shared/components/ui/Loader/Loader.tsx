import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Coffee, Sun, Sunset, Moon, Check, RotateCw } from 'lucide-react';
import { usePrefersReducedMotion } from '../../../hooks';
import { BouncingLoader } from './BouncingLoader';
import { BOUNCING_VARIANTS, type BouncingVariant } from './bouncingVariants';
import styles from './Loader.module.css';

export interface LoaderProps {
    variant?: 'fullScreen' | 'inline' | 'overlay';
    text?: string;
    showColdStartFunnyMessages?: boolean;
    minHeight?: string | number;
}

interface ColdStartConfig {
    title: string;
    message: string;
    badgeColor: string;
    accentColor: string;
    icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;
    animation: BouncingVariant;
    subMessages: string[];
}

/**
 * The stages of an actual cold start, with the time each one has finished by.
 *
 * These are not invented. They were read off a real Cloud Run start of this service: the JVM is up
 * at 3.3s, Spring's context at 9.0s, the first database connection at 12.2s, Flyway at 14.2s,
 * Hibernate's model at 19.9s, the repositories at 23.6s and Tomcat accepting traffic at 27.0s. So
 * the stage on screen is roughly what the server is really doing, rather than a decorative
 * sequence timed to look busy.
 *
 * If start-up time changes a lot, re-read it from the "Started BackendApplication in Xs" log line
 * and the timestamps around it. Being approximately right matters more than being precise.
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

/** Past this the estimate has clearly missed, and saying so beats a bar that has stopped moving. */
const OVERRUN_MS = EXPECTED_COLD_START_MS + 8000;

/** Below this a wait is ordinary and deserves a plain spinner, not an apology. */
const COLD_START_AFTER_MS = 2200;

/**
 * Readiness, asked rather than assumed.
 *
 * The previous code fetched '/api/health' — a path that does not exist, written relative, so on
 * the deployed site it hit the static host rather than the API and could never have reported
 * anything. This is the endpoint that does exist, on the configured backend, served without
 * authentication and CORS-enabled for the site's own origin.
 */
const HEALTH_URL = `${import.meta.env.VITE_BACKEND_URL || ''}/actuator/health`;

const getTimeBasedLoaderConfig = (): ColdStartConfig => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return {
            title: 'Morning Brew',
            message: "Waking up the backend server... Let's bounce into action!",
            badgeColor: 'rgba(245, 158, 11, 0.15)',
            accentColor: '#f59e0b',
            icon: Coffee,
            animation: 'cup',
            subMessages: [
                'Brewing morning coffee for the JVM...',
                'Stretching Java bytecode muscles...',
                'Powering up local cache structures...',
                "Ready to bounce into today's coding goals!"
            ]
        };
    }

    if (hour >= 12 && hour < 17) {
        return {
            title: 'Afternoon Fuel',
            message: 'Waking up the backend server... Powering up for the afternoon!',
            badgeColor: 'rgba(59, 130, 246, 0.15)',
            accentColor: '#3b82f6',
            icon: Sun,
            animation: 'road',
            subMessages: [
                'Injecting afternoon fuel...',
                'Stretching JVM heap memory...',
                'Establishing the PostgreSQL handshake...',
                'Preparing the compiler syntax engines!'
            ]
        };
    }

    if (hour >= 17 && hour < 22) {
        return {
            title: 'Evening Shift',
            message: 'Waking up the backend server... Warming up for your evening study!',
            badgeColor: 'rgba(236, 72, 153, 0.15)',
            accentColor: '#ec4899',
            icon: Sunset,
            animation: 'seesaw',
            subMessages: [
                'Waking up the sleepy server instance...',
                'Polishing learning modules for tonight...',
                'Checking connections to the database pool...',
                'Balancing the evening workload...'
            ]
        };
    }

    return {
        title: 'Late Night Grind',
        message: 'Waking up the backend server... Burning the midnight oil!',
        badgeColor: 'rgba(124, 58, 237, 0.15)',
        accentColor: '#7c3aed',
        icon: Moon,
        animation: 'turningBox',
        subMessages: [
            'Powering up midnight server cells...',
            'Waking up sleepy database connections...',
            'Turning things over for the night shift...',
            'Optimising the workspace for night owls...'
        ]
    };
};

export const Loader: React.FC<LoaderProps> = ({
    variant = 'inline',
    text,
    showColdStartFunnyMessages = true,
    minHeight
}) => {
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [messageIndex, setMessageIndex] = useState<number>(0);
    /** Set once /actuator/health answers, which means the wait is now data rather than start-up. */
    const [serverReady, setServerReady] = useState<boolean>(false);
    const prefersReducedMotion = usePrefersReducedMotion();

    const loaderConfig = useMemo(() => getTimeBasedLoaderConfig(), []);
    const [animation, setAnimation] = useState<BouncingVariant>(loaderConfig.animation);

    const cycleAnimation = useCallback(() => {
        setAnimation(current => {
            const next = BOUNCING_VARIANTS.indexOf(current) + 1;
            return BOUNCING_VARIANTS[next % BOUNCING_VARIANTS.length];
        });
    }, []);

    const rotatingMessages = useMemo(
        () => [
            loaderConfig.message,
            ...loaderConfig.subMessages,
            'Spinning up the Cloud Run container instance...',
            'The server was taking a power nap. Stretching bytecode...',
            'Warming up the PostgreSQL connection pool...',
            'Fetching your learning modules and progress...'
        ],
        [loaderConfig]
    );

    useEffect(() => {
        const timer = setInterval(() => setElapsedTime(prev => prev + 500), 500);
        return () => clearInterval(timer);
    }, []);

    /*
     * Rotate the messages once the wait is long enough to be worth narrating.
     *
     * The gate is a boolean, not elapsedTime itself. With elapsedTime in the dependencies this
     * effect re-ran on every 500ms tick, and its cleanup cleared the 3.5s interval each time
     * before it could ever fire — so the message never actually changed. The rotation had been
     * dead for as long as the list existed, which is why a thirty second wait showed one line.
     */
    const shouldRotateMessages = elapsedTime >= 2000 && showColdStartFunnyMessages;
    useEffect(() => {
        if (!shouldRotateMessages) return;
        const interval = setInterval(
            () => setMessageIndex(prev => (prev + 1) % rotatingMessages.length),
            3500
        );
        return () => clearInterval(interval);
    }, [shouldRotateMessages, rotatingMessages.length]);

    /*
     * Gated on a boolean for the same reason, and it matters more here: the cleanup flips
     * `cancelled`, so an effect re-running twice a second would discard the very response it was
     * waiting for. In this component, an effect owning a timer or a request must not depend on
     * the clock it is racing.
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

    const isColdStart = elapsedTime >= COLD_START_AFTER_MS && showColdStartFunnyMessages;
    const overrunning = elapsedTime > OVERRUN_MS && !serverReady;
    const BadgeIcon = loaderConfig.icon;

    const currentStage =
        COLD_START_STAGES.find(stage => elapsedTime < stage.until) ??
        COLD_START_STAGES[COLD_START_STAGES.length - 1];

    /*
     * Capped below 100 on purpose. The bar tracks an estimate of server start-up, and the request
     * is not finished until it is finished — a bar sitting full while nothing happens is the one
     * thing a loader must never do. It completes by disappearing.
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
             * One live region for the whole thing. Without it a screen reader announces nothing at
             * all for the twenty-odd seconds of a cold start, which is indistinguishable from a
             * page that has silently failed. "polite" so it waits for a pause, and the rotating
             * jokes are hidden from it so they do not talk over the stage every 3.5 seconds.
             */
            role="status"
            aria-busy="true"
            aria-live="polite"
        >
            {isColdStart ? (
                <div className={styles.coldStartCard}>
                    <div className={styles.animationSlot}>
                        <BouncingLoader
                            variant={animation}
                            ballColor={loaderConfig.accentColor}
                            onClick={cycleAnimation}
                            label="Change the animation"
                        />
                    </div>

                    <div
                        className={styles.titleBadge}
                        style={{
                            backgroundColor: loaderConfig.badgeColor,
                            borderColor: `${loaderConfig.accentColor}40`,
                            color: loaderConfig.accentColor
                        }}
                    >
                        <BadgeIcon size={12} color={loaderConfig.accentColor} />
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
                                ? 'The instance sleeps when idle, so the first visit pays the start-up.'
                                : 'Free-tier server instance is spinning up. Thanks for your patience!'}
                    </p>

                    {overrunning && (
                        <button
                            type="button"
                            className={styles.retryBtn}
                            onClick={() => window.location.reload()}
                        >
                            <RotateCw size={13} /> Reload the page
                        </button>
                    )}

                    <p className={styles.hint} aria-hidden="true">
                        Tap the animation to change it
                    </p>
                </div>
            ) : (
                <>
                    <div className={styles.spinnerContainer}>
                        <div
                            className={styles.spinnerRing}
                            style={{ borderTopColor: 'var(--tech-blue, #0b57d0)' }}
                        />
                        <div className={styles.spinnerCenterIcon}>
                            <RefreshCw size={16} color="var(--tech-blue, #0b57d0)" />
                        </div>
                    </div>
                    <div className={styles.textContainer}>
                        <p className={styles.messageText}>{text || 'Loading...'}</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default Loader;
