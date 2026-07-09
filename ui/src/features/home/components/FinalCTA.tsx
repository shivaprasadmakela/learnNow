import React from 'react';
import { Button } from '../../../shared/components/Button/Button';
import { ChevronRightIcon } from '../../../shared/components/Icons';
import styles from './Home.module.css';

interface FinalCTAProps {
    onSelectCourse: (courseId: number) => void;
    isLoggedIn: boolean;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS') => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ 
    onSelectCourse, 
    isLoggedIn, 
    changeView 
}) => {
    const handleStart = () => {
        if (isLoggedIn) {
            onSelectCourse(1);
        } else {
            changeView('LOGIN');
        }
    };

    return (
        <section className={styles.bottomBannerSection}>
            <div className={styles.bottomBannerGlow} />
            <div className={styles.bottomLogoG}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="url(#techGradCTA)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                    <line x1="14" y1="4" x2="10" y2="20" />
                    <defs>
                        <linearGradient id="techGradCTA" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <h2 className={styles.bottomTitle}>Start Building Your Future Today</h2>
            <p className={styles.bottomDesc}>
                Explore interactive courses, practice with quizzes, revise important concepts,
                and continuously improve your software engineering skills.
            </p>
            <div className={styles.heroButtons}>
                <Button variant="primary" size="lg" onClick={handleStart}>
                    Start Learning
                </Button>
                <button
                    className={styles.heroSecondaryBtn}
                    onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Browse Catalog <ChevronRightIcon size={16} />
                </button>
            </div>
        </section>
    );
};
export default FinalCTA;
