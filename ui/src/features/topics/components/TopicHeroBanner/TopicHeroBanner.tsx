import React from 'react';
import styles from '../../pages/TopicsPage/TopicsPage.module.css';
import type { TopicHeroBannerProps } from './TopicHeroBanner.types';

export const TopicHeroBanner: React.FC<TopicHeroBannerProps> = ({
    pathTitle,
    managedBy,
    activitiesCount,
    lastUpdated,
    progressPercent,
    onContinueClick
}) => {
    return (
        <div className={styles.heroBannerWrapper}>
            <div className={styles.heroBanner}>
                {/* Top content: left info */}
                <div className={styles.heroTopContent}>
                    {/* Left: Badge, Title, Details */}
                    <div className={styles.heroLeft}>
                        <div className={styles.heroBadge}>
                            <i className="fa-solid fa-dragon" style={{ marginRight: '6px' }} aria-hidden="true" />
                            Path
                        </div>
                        <h1 className={styles.heroTitle}>{pathTitle}</h1>
                        <div className={styles.metaRow}>
                            <span className={styles.metaDetail}>Managed by {managedBy}</span>
                            <span className={styles.metaDetail}>{activitiesCount} topics</span>
                            <span className={styles.metaDetail}>Last updated {lastUpdated}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA + Progress */}
                <div className={styles.progressRow}>
                    <button className={styles.continueButton} onClick={onContinueClick}>
                        <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.9rem' }} aria-hidden="true" />
                        {progressPercent > 0 ? 'Continue' : 'Start'}
                    </button>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressTrack} title={`Overall Progress in this module: ${progressPercent}%`}>
                            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                    <span className={styles.overallProgressBadge}>
                        <i className="fa-solid fa-chart-line" aria-hidden="true" />
                        Overall Progress in this module: {progressPercent}%
                    </span>
                </div>
            </div>
        </div>
    );
};
