import { Trash2 } from 'lucide-react';
import type { LearningCardProps } from './LearningCard.types';
import styles from './LearningCard.module.css';
import { CardBadge } from './components/CardBadge';
import { CardProgressBar } from './components/CardProgressBar';
import { CardActionArrow } from './components/CardActionArrow';
import { CardDurationMeta } from './components/CardDurationMeta';
import { CardCompletedBadge } from './components/CardCompletedBadge';
import { BookmarkButton } from '../../../../features/notes';

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
    badgeVariant,
    titleIcon,
    isBookmarked,
    onToggleBookmark,
    onDelete,
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
                    <div className={styles.badgeGroup}>
                        <CardBadge
                            label={badgeLabel}
                            icon={badgeIcon}
                            isCompleted={isCompleted}
                            variant={badgeVariant}
                        />
                    </div>
                    <h3 className={styles.listTitle}>
                        {titleIcon && <span className={styles.titleIcon}>{titleIcon}</span>}
                        <span>{title}</span>
                    </h3>
                </div>

                <div className={styles.listRightContent}>
                    {hasProgress ? (
                        <CardProgressBar percentage={pct} containerClassName={styles.listProgressContainer} />
                    ) : (
                        <div className={styles.listMetaRow}>
                            <CardDurationMeta duration={duration} footerText={footerText} />
                            {onToggleBookmark && (
                                <BookmarkButton
                                    isBookmarked={Boolean(isBookmarked)}
                                    onToggle={onToggleBookmark}
                                    showLabel={false}
                                />
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    className={styles.deleteCardBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    title="Delete Course"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
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
                <div className={styles.badgeGroup}>
                    <CardBadge
                        label={badgeLabel}
                        icon={badgeIcon}
                        isCompleted={isCompleted}
                        variant={badgeVariant}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {onToggleBookmark && (
                        <BookmarkButton
                            isBookmarked={Boolean(isBookmarked)}
                            onToggle={onToggleBookmark}
                            showLabel={false}
                        />
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            className={styles.deleteCardBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            title="Delete Course"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    {isCompleted && <CardCompletedBadge />}
                </div>
            </div>

            <div className={styles.cardMainContent}>
                <h3 className={styles.cardTitle}>
                    {titleIcon && <span className={styles.titleIcon}>{titleIcon}</span>}
                    <span>{title}</span>
                </h3>
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
