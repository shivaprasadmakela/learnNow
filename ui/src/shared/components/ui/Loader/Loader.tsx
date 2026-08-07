import React, { useState, useEffect, useMemo } from 'react';
import { Coffee, Rocket, Server, Zap, Cpu, Sparkles, RefreshCw, Sun, Moon, Sunset } from 'lucide-react';
import styles from './Loader.module.css';

export interface LoaderProps {
    variant?: 'fullScreen' | 'inline' | 'overlay';
    text?: string;
    showColdStartFunnyMessages?: boolean;
    minHeight?: string | number;
}

interface ColdStartQuote {
    icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;
    title: string;
    message: string;
    badgeColor: string;
    accentColor: string;
}

const getTimeBasedFirstQuote = (): ColdStartQuote => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return {
            icon: Coffee,
            title: 'Morning Brew',
            message: 'Waking up the backend server... It needs its morning coffee!',
            badgeColor: 'rgba(245, 158, 11, 0.15)',
            accentColor: '#f59e0b'
        };
    } else if (hour >= 12 && hour < 17) {
        return {
            icon: Sun,
            title: 'Afternoon Fuel',
            message: 'Waking up the backend server... Powering up for the afternoon!',
            badgeColor: 'rgba(245, 158, 11, 0.15)',
            accentColor: '#f59e0b'
        };
    } else if (hour >= 17 && hour < 22) {
        return {
            icon: Sunset,
            title: 'Evening Shift',
            message: 'Waking up the backend server... Warming up for your evening study!',
            badgeColor: 'rgba(236, 72, 153, 0.15)',
            accentColor: '#ec4899'
        };
    } else {
        return {
            icon: Moon,
            title: 'Late Night Grind',
            message: 'Waking up the backend server... Burning the midnight oil!',
            badgeColor: 'rgba(124, 58, 237, 0.15)',
            accentColor: '#7c3aed'
        };
    }
};

const COMMON_QUOTES: ColdStartQuote[] = [
    {
        icon: Rocket,
        title: 'GCP Cold Start',
        message: 'Spinning up GCP Cloud Run container instance...',
        badgeColor: 'rgba(11, 87, 208, 0.15)',
        accentColor: '#0b57d0'
    },
    {
        icon: Server,
        title: 'Power Nap',
        message: 'Server was taking a power nap. Stretching JVM bytecodes...',
        badgeColor: 'rgba(124, 58, 237, 0.15)',
        accentColor: '#7c3aed'
    },
    {
        icon: Zap,
        title: 'DB Connection',
        message: 'Warming up PostgreSQL database connection pools...',
        badgeColor: 'rgba(16, 185, 129, 0.15)',
        accentColor: '#10b981'
    },
    {
        icon: Cpu,
        title: 'Spells Compiling',
        message: 'Casting compilation spells... Almost ready!',
        badgeColor: 'rgba(236, 72, 153, 0.15)',
        accentColor: '#ec4899'
    },
    {
        icon: Sparkles,
        title: 'Syncing Metrics',
        message: 'Fetching latest learning modules & progress state...',
        badgeColor: 'rgba(0, 242, 254, 0.15)',
        accentColor: '#00f2fe'
    }
];

export const Loader: React.FC<LoaderProps> = ({
    variant = 'inline',
    text,
    showColdStartFunnyMessages = true,
    minHeight
}) => {
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [quoteIndex, setQuoteIndex] = useState<number>(0);

    const coldStartQuotes = useMemo(() => [getTimeBasedFirstQuote(), ...COMMON_QUOTES], []);

    // Track elapsed loading time
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 500);
        }, 500);

        return () => clearInterval(timer);
    }, []);

    // Rotate quotes every 3.5 seconds when loading takes > 2 seconds
    useEffect(() => {
        if (elapsedTime < 2000 || !showColdStartFunnyMessages) return;

        const quoteInterval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % coldStartQuotes.length);
        }, 3500);

        return () => clearInterval(quoteInterval);
    }, [elapsedTime, showColdStartFunnyMessages, coldStartQuotes.length]);

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
    const currentQuote = coldStartQuotes[quoteIndex];
    const QuoteIcon = currentQuote.icon;

    const containerClassName =
        variant === 'fullScreen'
            ? styles.loaderFullScreen
            : variant === 'overlay'
                ? styles.loaderOverlay
                : styles.loaderInline;

    return (
        <div className={containerClassName} style={minHeight ? { minHeight } : undefined}>
            <div className={styles.spinnerContainer}>
                <div
                    className={styles.spinnerRing}
                    style={{
                        borderTopColor: isColdStart ? currentQuote.accentColor : 'var(--tech-blue, #0b57d0)'
                    }}
                />
                <div className={styles.spinnerCenterIcon}>
                    {isColdStart ? (
                        <QuoteIcon size={18} color={currentQuote.accentColor} />
                    ) : (
                        <RefreshCw size={16} color="var(--tech-blue, #0b57d0)" />
                    )}
                </div>
            </div>

            <div className={styles.textContainer}>
                {isColdStart ? (
                    <>
                        <div
                            className={styles.titleBadge}
                            style={{
                                backgroundColor: currentQuote.badgeColor,
                                borderColor: `${currentQuote.accentColor}40`,
                                color: currentQuote.accentColor
                            }}
                        >
                            <QuoteIcon size={12} color={currentQuote.accentColor} />
                            <span>{currentQuote.title}</span>
                        </div>
                        <p className={styles.messageText}>{currentQuote.message}</p>
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
