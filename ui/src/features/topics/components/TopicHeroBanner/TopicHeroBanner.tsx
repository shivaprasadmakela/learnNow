import React from 'react';
import styles from '../../pages/TopicsPage/TopicsPage.module.css';
import type { TopicHeroBannerProps } from './TopicHeroBanner.types';

export const TopicHeroBanner: React.FC<TopicHeroBannerProps> = ({
    pathTitle,
    description,
    managedBy,
    activitiesCount,
    progressPercent,
    onContinueClick
}) => {
    return (
        <div className={styles.heroBannerWrapper}>
            <div className={styles.heroBanner}>
                {/* Left Side: Badge, Title, Meta */}
                <div className={styles.heroLeft}>
                    <div className={styles.heroHeaderInline}>
                        <span className={styles.heroBadge}>
                            <i className="fa-solid fa-dragon" style={{ marginRight: '6px' }} aria-hidden="true" />
                            Path
                        </span>
                        <h1 className={styles.heroTitle}>{pathTitle}</h1>
                    </div>

                    {description && <p className={styles.heroDescription}>{description}</p>}

                    <div className={styles.metaRow}>
                        {managedBy && <span className={styles.metaDetail}>Managed by {managedBy}</span>}
                        {typeof activitiesCount === 'number' && (
                            <span className={styles.metaDetail}>{activitiesCount} {activitiesCount === 1 ? 'topic' : 'topics'}</span>
                        )}
                    </div>
                </div>

                {/* Right Side: Progress & Action */}
                <div className={styles.heroRightAction}>
                    <div className={styles.heroProgressBlock}>
                        <div className={styles.progressTextRow}>
                            <span className={styles.progressLabel}>Overall Progress</span>
                            <span className={styles.progressVal}>{progressPercent}%</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>

                    <button className={styles.continueButton} onClick={onContinueClick}>
                        {progressPercent > 0 ? 'Continue' : 'Start Path'}
                        <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px', fontSize: '0.85rem' }} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
};
