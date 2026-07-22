import React from 'react';
import type { LearningCardProps } from './LearningCard.types';
import styles from './LearningCard.module.css';
import { CardBadge } from './components/CardBadge';
import { CardProgressBar } from './components/CardProgressBar';
import { CardActionArrow } from './components/CardActionArrow';
import { CardDurationMeta } from './components/CardDurationMeta';
import { CardCompletedBadge } from './components/CardCompletedBadge';

export const LearningCard: React.FC<LearningCardProps> = ({
    layout = 'grid',
    badgeLabel,
    badgeIcon,
    title,
    description,
    footerText,
    duration,
    progressPercentage,
    showProgress = false,
    isCompleted = false,
    onClick,
    buttonTooltip = 'Explore',
    className = ''
}) => {
    const pct = isCompleted ? 100 : Math.min(100, Math.max(0, progressPercentage || 0));
    const hasProgress = (showProgress || typeof progressPercentage === 'number') && pct > 0;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
            e.preventDefault();
            onClick();
        }
    };

    if (layout === 'list') {
        return (
            <div
                className={`${styles.listCardContainer} ${className}`}
                onClick={onClick}
                role="button"
                tabIndex={0}
                onKeyDown={handleKeyDown}
            >
                <div className={styles.listLeftContent}>
                    <CardBadge label={badgeLabel} icon={badgeIcon} />
                    <h3 className={styles.listTitle}>{title}</h3>
                </div>

                <div className={styles.listRightContent}>
                    {hasProgress ? (
                        <CardProgressBar percentage={pct} containerClassName={styles.listProgressContainer} />
                    ) : (
                        <div className={styles.listMetaRow}>
                            <CardDurationMeta duration={duration} footerText={footerText} />
                            <CardActionArrow tooltip={buttonTooltip} onClick={onClick} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${styles.cardContainer} ${className}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <div className={styles.cardTopRow}>
                <CardBadge label={badgeLabel} icon={badgeIcon} />
                {isCompleted && <CardCompletedBadge />}
            </div>

            <div className={styles.cardMainContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {description && <p className={styles.cardDescription}>{description}</p>}
            </div>

            {hasProgress ? (
                <CardProgressBar percentage={pct} />
            ) : (
                <div className={styles.cardFooter}>
                    <CardDurationMeta duration={duration} footerText={footerText} />
                    <CardActionArrow tooltip={buttonTooltip} onClick={onClick} />
                </div>
            )}
        </div>
    );
};

export default LearningCard;
