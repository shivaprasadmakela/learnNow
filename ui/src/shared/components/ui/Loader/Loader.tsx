import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Coffee, Sun, Sunset, Moon } from 'lucide-react';
import styles from './Loader.module.css';

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

    // Rotate messages every 3.5 seconds when loading takes > 2 seconds
    useEffect(() => {
        if (elapsedTime < 2000 || !showColdStartFunnyMessages) return;

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % rotatingMessages.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [elapsedTime, showColdStartFunnyMessages, rotatingMessages.length]);

    // Optional background health ping when response takes > 3s
    useEffect(() => {
        if (elapsedTime >= 3000 && elapsedTime < 3500) {
            fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                    if (data?.status === 'UP') {
                        console.log('Backend health check UP during cold start');
                    }
                })
                .catch(() => {
                    // Ignore ping error during boot
                });
        }
    }, [elapsedTime]);

    const isColdStart = elapsedTime >= 2200 && showColdStartFunnyMessages;
    const QuoteIcon = loaderConfig.icon;

    const containerClassName =
        variant === 'fullScreen'
            ? styles.loaderFullScreen
            : variant === 'overlay'
                ? styles.loaderOverlay
                : styles.loaderInline;

    return (
        <div className={containerClassName} style={minHeight ? { minHeight } : undefined}>
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
                        <p className={styles.messageText}>{rotatingMessages[messageIndex]}</p>
                        <p className={styles.subNotice}>
                            Free-tier server instance is spinning up. Thanks for your patience!
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
