import React from 'react';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import styles from './LearningCard.module.css';

export interface LearningCardProps {
    /** Card display layout: 'grid' (default card layout) or 'list' (horizontal row layout) */
    layout?: 'grid' | 'list';
    /** Label for the top pill badge e.g. "Path", "Course", "Topic" */
    badgeLabel?: string;
    /** Icon for the top pill badge (defaults to 4-box grid icon) */
    badgeIcon?: React.ReactNode;
    /** Card title */
    title: string;
    /** Card description paragraph */
    description?: string;
    /** Footer metadata text e.g. "Managed by Google Cloud" */
    footerText?: string;
    /** Duration string e.g. "2 hours", "45 mins" */
    duration?: string;
    /** Progress percentage (0-100). If provided or showProgress is true, shows horizontal progress bar */
    progressPercentage?: number;
    showProgress?: boolean;
    /** Completion status boolean */
    isCompleted?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Optional action button title/tooltip */
    buttonTooltip?: string;
    /** Optional extra className */
    className?: string;
}

const DefaultGridIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
    </svg>
);

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

    if (layout === 'list') {
        return (
            <div
                className={`${styles.listCardContainer} ${className}`}
                onClick={onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
                        e.preventDefault();
                        onClick();
                    }
                }}
            >
                <div className={styles.listLeftContent}>
                    {badgeLabel && (
                        <div className={styles.badgePill}>
                            <span className={styles.badgeIcon}>
                                {badgeIcon || <DefaultGridIcon />}
                            </span>
                            <span>{badgeLabel}</span>
                        </div>
                    )}
                    <h3 className={styles.listTitle}>{title}</h3>
                </div>

                <div className={styles.listRightContent}>
                    {hasProgress ? (
                        <div className={styles.listProgressContainer}>
                            <div className={styles.progressTrack}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className={styles.progressText}>{pct}%</span>
                        </div>
                    ) : (
                        <div className={styles.listMetaRow}>
                            {duration ? (
                                <div className={styles.footerMeta}>
                                    <Clock size={16} />
                                    <span>{duration}</span>
                                </div>
                            ) : (
                                footerText && (
                                    <div className={styles.footerMeta}>
                                        <span>{footerText}</span>
                                    </div>
                                )
                            )}
                            <button
                                type="button"
                                className={styles.actionCircleBtn}
                                title={buttonTooltip}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onClick) onClick();
                                }}
                            >
                                <ArrowRight size={18} />
                            </button>
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
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onClick) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className={styles.cardTopRow}>
                {badgeLabel ? (
                    <div className={styles.badgePill}>
                        <span className={styles.badgeIcon}>
                            {badgeIcon || <DefaultGridIcon />}
                        </span>
                        <span>{badgeLabel}</span>
                    </div>
                ) : <div />}

                {isCompleted && (
                    <div className={styles.completedBadge}>
                        <CheckCircle2 size={12} />
                        <span>Completed</span>
                    </div>
                )}
            </div>

            <div className={styles.cardMainContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {description && <p className={styles.cardDescription}>{description}</p>}
            </div>

            {hasProgress ? (
                <div className={styles.progressContainer}>
                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className={styles.progressText}>{pct}%</span>
                </div>
            ) : (
                <div className={styles.cardFooter}>
                    <div className={styles.footerMeta}>
                        {duration ? (
                            <>
                                <Clock size={16} />
                                <span>{duration}</span>
                            </>
                        ) : (
                            <span>{footerText || 'Managed by LearnNow'}</span>
                        )}
                    </div>
                    <button
                        type="button"
                        className={styles.actionCircleBtn}
                        title={buttonTooltip}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onClick) onClick();
                        }}
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default LearningCard;
