import React from 'react';
import styles from '../../pages/TopicsPage/TopicsPage.module.css';
import bunnyBrain from '../../../../assets/bunny-brain.png';
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
                {/* Top content: left info + right illustration */}
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

                    {/* Right: Bunny brain learning illustration */}
                    <div className={styles.heroRight}>
                        <img src={bunnyBrain} className={styles.bunnyBrainImg} alt="Learning Path Illustration" />
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
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-chart-line" aria-hidden="true" />
                        Overall Progress in this module: {progressPercent}%
                    </span>
                </div>
            </div>
        </div>
    );
};
