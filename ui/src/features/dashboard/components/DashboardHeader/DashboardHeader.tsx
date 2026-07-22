import React from 'react';
import type { UserProfile } from '../../../../types';
import styles from '../../styles/Dashboard.module.css';
import owlPointer from '../../../../assets/owl-pointer.png';
import type { DashboardHeaderProps } from './DashboardHeader.types';

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

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    banner,
    paths,
    onSelectPath
}) => {
    const bannerPath = paths.find(p => p.id === banner.pathId);
    const isPathStarted = bannerPath ? (bannerPath.progressPercentage > 0 || bannerPath.completedTopicsCount > 0) : false;
    const buttonLabel = isPathStarted || banner.type === 'REVIEW' ? 'Continue' : 'Start';

    return (
        <div className={styles.currentCourseCard}>
            <div className={styles.courseCardLeft}>
                <div className={styles.courseCardIllustration}>
                    <img src={owlPointer} className={styles.owlPointerImg} alt="Learning Path" />
                </div>
            </div>
            <div className={styles.courseCardRight}>
                <span className={styles.courseCardPreTitle}>
                    {banner.type === 'FEATURED' ? 'Recommended Path' : 'Review Path'} &gt;
                </span>
                <h2 className={styles.courseCardTitle}>{banner.pathTitle}</h2>
                <p className={styles.courseCardDesc}>{banner.pathDescription}</p>
                <button
                    type="button"
                    className={styles.startButton}
                    onClick={() => banner.pathId && onSelectPath(banner.pathId)}
                    disabled={!banner.pathId}
                >
                    <i className="fa-solid fa-play" style={{ fontSize: '0.85rem' }} aria-hidden="true" />
                    <span>{buttonLabel}</span>
                </button>
            </div>
        </div>
    );
};
