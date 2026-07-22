import React from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import styles from '../styles/Home.module.css';
import { StreakCalendar } from '../../dashboard/components/StreakCalendar';
import { WeeklyLeagueBoard } from '../../dashboard/components/WeeklyLeagueBoard';
import { LearningCard } from '../../../shared/components/cards';
import type { WeeklyCalendarDay, WeeklyLeaderboardEntry } from '../../dashboard/types';

interface HeroProps {
    isLoggedIn: boolean;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => void;
}

const DUMMY_WEEKLY_CALENDAR: WeeklyCalendarDay[] = [
    { name: 'Mon', date: '2026-07-20', completed: true, isDotted: false },
    { name: 'Tue', date: '2026-07-21', completed: true, isDotted: false },
    { name: 'Wed', date: '2026-07-22', completed: true, isDotted: false },
    { name: 'Thu', date: '2026-07-23', completed: true, isDotted: false },
    { name: 'Fri', date: '2026-07-24', completed: true, isDotted: false },
    { name: 'Sat', date: '2026-07-25', completed: false, isDotted: true },
    { name: 'Sun', date: '2026-07-26', completed: false, isDotted: true },
];

const DUMMY_LEADERBOARD: WeeklyLeaderboardEntry[] = [
    { userId: '1', fullName: 'Shiva Prasad', avatar: '', weeklyPoints: 480, currentStreak: 7, rank: 1, badge: 'GOLD', isCurrentUser: true },
    { userId: '2', fullName: 'Alex M.', avatar: '', weeklyPoints: 410, currentStreak: 5, rank: 2, badge: 'SILVER', isCurrentUser: false },
];

export const Hero: React.FC<HeroProps> = ({ isLoggedIn, changeView }) => {
    const handleCardClick = () => {
        if (isLoggedIn) {
            changeView('DASHBOARD');
        } else {
            changeView('LOGIN');
        }
    };

    const scrollToCatalog = () => {
        document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className={styles.heroSection}>
            <div className={styles.heroBadge}>
                <Sparkles size={14} /> Interactive Developer Academy & Analytics
            </div>
            <h1 className={styles.heroTitle}>
                Learn. Streak.{' '}
                <span className={styles.heroTitleHighlight}>Conquer.</span>
            </h1>
            <p className={styles.heroSubtitle}>
                The gamified way to master software engineering—from core fundamentals to advanced architectures.
            </p>

            {/* 3 Equal-Width & Equal-Height Hero Cards */}
            <div className={styles.widgetsGrid}>
                <div className={styles.heroCardWrapper} onClick={handleCardClick}>
                    <StreakCalendar
                        currentStreak={7}
                        weeklyCalendar={DUMMY_WEEKLY_CALENDAR}
                    />
                </div>

                <div className={styles.heroCardWrapper} onClick={handleCardClick}>
                    <WeeklyLeagueBoard
                        entries={DUMMY_LEADERBOARD}
                    />
                </div>

                <div className={styles.heroCardWrapper} onClick={handleCardClick}>
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
