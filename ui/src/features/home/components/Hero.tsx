import React, { useEffect, useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import styles from '../styles/Home.module.css';
import { StreakCalendar } from '../../dashboard/components/StreakCalendar';
import { WeeklyLeagueBoard } from '../../dashboard/components/WeeklyLeagueBoard';
import { LearningCard } from '../../../shared/components/cards';
import { usePrefersReducedMotion } from '../../../shared/hooks';
import { DEMO_LEADERBOARD, DEMO_WEEKLY_CALENDAR } from '../demoData';

interface HeroProps {
    isLoggedIn: boolean;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => void;
}

/**
 * The word that changes in the headline.
 *
 * All four are rendered stacked in one grid cell, so the container is always as wide as the
 * longest of them and the centred headline never jumps as the word swaps.
 */
const ROTATING_WORDS = ['Conquer.', 'Ship it.', 'Debug it.', 'Deploy.'];
const WORD_MS = 2600;

export const Hero: React.FC<HeroProps> = ({ isLoggedIn, changeView }) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [wordIndex, setWordIndex] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion) return;
        const timer = window.setInterval(
            () => setWordIndex(index => (index + 1) % ROTATING_WORDS.length),
            WORD_MS
        );
        return () => window.clearInterval(timer);
    }, [prefersReducedMotion]);

    const handleCardClick = () => {
        if (isLoggedIn) {
            changeView('DASHBOARD');
        } else {
            changeView('LOGIN');
        }
    };

    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCardClick();
        }
    };

    /*
     * Feeds the pointer position to the card's glow. Written as custom properties rather than as
     * React state because it fires on every mouse move — state here would re-render the three
     * dashboard widgets dozens of times a second for a lighting effect.
     */
    const handleCardPointer = (event: React.MouseEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        const bounds = element.getBoundingClientRect();
        element.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        element.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
    };

    const scrollToCatalog = () => {
        document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const cardProps = {
        className: styles.heroCardWrapper,
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleCardClick,
        onKeyDown: handleCardKeyDown,
        onMouseMove: handleCardPointer
    };

    return (
        <section className={styles.heroSection}>
            <div className={styles.heroBadge}>
                <Sparkles size={14} /> Interactive Developer Academy & Analytics
            </div>
            <h1 className={styles.heroTitle}>
                Learn. Streak.{' '}
                <span className={styles.wordRotator}>
                    {ROTATING_WORDS.map((word, index) => (
                        <span
                            key={word}
                            className={`${styles.heroTitleHighlight} ${styles.rotatorWord} ${
                                index === wordIndex ? styles.rotatorWordActive : ''
                            }`}
                            aria-hidden={index === wordIndex ? undefined : true}
                        >
                            {word}
                        </span>
                    ))}
                </span>
            </h1>
            <p className={styles.heroSubtitle}>
                The gamified way to master software engineering—from core fundamentals to advanced architectures.
            </p>

            {/* 3 Equal-Width & Equal-Height Hero Cards */}
            <div className={styles.widgetsGrid}>
                <div {...cardProps} aria-label="See your streak on the dashboard">
                    <StreakCalendar
                        currentStreak={7}
                        weeklyCalendar={DEMO_WEEKLY_CALENDAR}
                    />
                </div>

                <div {...cardProps} aria-label="See the weekly league">
                    <WeeklyLeagueBoard
                        entries={DEMO_LEADERBOARD.slice(0, 2)}
                    />
                </div>

                <div {...cardProps} aria-label="Open a learning path">
                    <LearningCard
                        badgeLabel="Backend Engineering"
                        title="Spring Boot & Java 21 Monolith"
                        description="Build high-performance REST APIs, JPA entities, Flyway migrations & JWT auth."
                        footerText="5 / 8 Topics Completed"
                        progressPercentage={68}
                        showProgress={true}
                    />
                </div>
            </div>

            {/* Scroll Indicator Prompt */}
            <div className={styles.scrollExplorePrompt} onClick={scrollToCatalog}>
                <span>Explore Learning Paths</span>
                <ChevronDown size={16} className={styles.bounceIcon} />
            </div>
        </section>
    );
};

export default Hero;
