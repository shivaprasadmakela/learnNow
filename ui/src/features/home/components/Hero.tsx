import React from 'react';
import { Button } from '../../../shared/components/Button/Button';
import { ChevronRightIcon } from '../../../shared/components/Icons';
import styles from './Home.module.css';

interface HeroProps {
    isLoggedIn: boolean;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS') => void;
}

export const Hero: React.FC<HeroProps> = ({ isLoggedIn, changeView }) => {
    const handleStart = () => {
        if (isLoggedIn) {
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            changeView('LOGIN');
        }
    };

    const scrollToCatalog = () => {
        document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className={styles.heroSection}>
            <div className={styles.heroBadge}>Interactive Learning Platform for Developers</div>
            <h1 className={styles.heroTitle}>
                Learn, Practice, and{' '}
                <span className={styles.heroTitleHighlight}>Grow as a Software Engineer</span>
            </h1>
            <p className={styles.heroSubtitle}>
                Master software engineering with interactive courses, structured learning paths, hands-on exercises,
                and revision resources designed for modern developers.
            </p>
            <div className={styles.heroButtons}>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStart}
                >
                    Start Learning
                </Button>
                <button
                    className={styles.heroSecondaryBtn}
                    onClick={scrollToCatalog}
                >
                    Explore Paths <ChevronRightIcon size={16} />
                </button>
            </div>
        </section>
    );
};
export default Hero;
