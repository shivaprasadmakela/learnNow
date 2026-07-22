import React from 'react';
import { Button } from '../../../shared/components';
import { ChevronRight, Rocket } from 'lucide-react';
import styles from '../styles/Home.module.css';

interface FinalCTAProps {
    onSelectCourse: (courseId: number) => void;
    isLoggedIn: boolean;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
    isLoggedIn,
    changeView
}) => {
    const handleStart = () => {
        if (isLoggedIn) {
            changeView('DASHBOARD');
        } else {
            changeView('LOGIN');
        }
    };

    return (
        <section className={styles.bottomBannerSection}>
            <div className={styles.bottomBannerGlow} />
            <div className={styles.bottomLogoG}>
                <Rocket size={32} style={{ color: 'var(--tech-blue)' }} />
            </div>
            <h2 className={styles.bottomTitle}>Start Building Your Developer Future Today</h2>
            <p className={styles.bottomDesc}>
                Explore interactive courses, complete daily topic progress, track your streak analytics,
                and continuously level up your software engineering craft.
            </p>
            <div className={styles.heroButtons}>
                <Button variant="primary" size="lg" onClick={handleStart}>
                    {isLoggedIn ? 'Go to Dashboard' : 'Get Started Now'}
                </Button>
                <button
                    className={styles.heroSecondaryBtn}
                    onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Browse Catalog <ChevronRight size={16} />
                </button>
            </div>
        </section>
    );
};

export default FinalCTA;
