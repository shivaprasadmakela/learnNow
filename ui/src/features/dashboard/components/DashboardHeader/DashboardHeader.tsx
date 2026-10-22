import React from 'react';
import type { UserProfile } from '../../../../types';
import styles from '../../styles/Dashboard.module.css';
import owlPointer from '../../../../assets/owl-pointer.png';
import type { DashboardHeaderProps } from './DashboardHeader.types';
import type { DashboardBanner } from '../../types';

export const WelcomeGreeting: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
    if (!profile) return null;
    return (
        <div style={{ marginBottom: 'var(--space-6)' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                Welcome back, {profile.fullName || 'Learner'}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0 0', fontSize: '0.95rem' }}>
                Ready to continue your learning progress?
            </p>
        </div>
    );
};

/** What the card is for, in the learner's terms, and what its button says. */
const COPY: Record<DashboardBanner['type'], { label: string; action?: string }> = {
    CONTINUE: { label: 'Continue where you left off', action: 'Continue' },
    NEXT: { label: 'Recommended next', action: 'Start path' },
    START: { label: 'Start here', action: 'Start learning' },
    DONE: { label: 'All caught up' }
};

/**
 * The dashboard's next-step card. The server decides what it shows (see NextStepService); the
 * button opens the exact lesson it names, so it cannot land on the wrong path.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ banner, onOpenLesson }) => {
    const copy = COPY[banner.type] ?? COPY.START;
    const lesson = banner.nextLesson;

    return (
        <div className={styles.currentCourseCard}>
            <div className={styles.courseCardLeft}>
                <div className={styles.courseCardIllustration}>
                    <img src={owlPointer} className={styles.owlPointerImg} alt="" />
                </div>
            </div>
            <div className={styles.courseCardRight}>
                <span className={styles.courseCardPreTitle}>{copy.label}</span>
                <h2 className={styles.courseCardTitle}>{banner.pathTitle}</h2>
                {banner.reason && <p className={styles.courseCardDesc}>{banner.reason}</p>}
                {lesson && (
                    <p className={styles.courseCardNext}>
                        <span className={styles.courseCardNextLabel}>Next lesson</span>{' '}
                        {lesson.subtopicTitle}
                        <span className={styles.courseCardNextTopic}> · {lesson.topicTitle}</span>
                    </p>
                )}
                {lesson && copy.action && (
                    <button type="button" className={styles.startButton} onClick={() => onOpenLesson(lesson)}>
                        <i className="fa-solid fa-play" style={{ fontSize: '0.85rem' }} aria-hidden="true" />
                        <span>{copy.action}</span>
                    </button>
                )}
            </div>
        </div>
    );
};
