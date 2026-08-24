import React from 'react';
import styles from './ContentHeroBanner.module.css';

export interface ContentHeroBannerProps {
    /** The kind of thing this is — "Path", "Problem sheet". */
    badgeLabel: string;
    badgeIcon?: React.ReactNode;
    title: string;
    description?: string;
    /**
     * Small facts beside the title: who maintains it, how many items. Pre-formatted strings rather
     * than named props, because every module counts something different and pluralises it its own
     * way.
     */
    meta?: string[];
    progressPercent: number;
    progressLabel?: string;
    /**
     * Replaces the percentage row with a count. Where the total is the interesting number —
     * "12 / 43 solved" — a percentage buries it.
     */
    headline?: { value: React.ReactNode; caption: string };
    /** Omit to render no button. */
    actionLabel?: string;
    onAction?: () => void;
    /** Extra content on the same card, under a divider: a difficulty split, an outbound link. */
    footer?: React.ReactNode;
    progressAriaLabel?: string;
}

/**
 * The banner at the top of a content module.
 *
 * Was `TopicHeroBanner`, hardcoded to a learning path: the badge said "Path", the meta row said
 * "Managed by X" and "N topics", and the button said "Start Path". The DSA sheet had grown its own
 * header doing the same job, so the hardcoded parts became props and the one difference — a count
 * instead of a percentage, with a difficulty split below — became the `headline` and `footer` slots.
 */
export const ContentHeroBanner: React.FC<ContentHeroBannerProps> = ({
    badgeLabel,
    badgeIcon,
    title,
    description,
    meta = [],
    progressPercent,
    progressLabel = 'Overall Progress',
    headline,
    actionLabel,
    onAction,
    footer,
    progressAriaLabel
}) => {
    const top = (
        <>
            <div className={styles.left}>
                <div className={styles.headerInline}>
                    <span className={styles.badge}>
                        {badgeIcon}
                        {badgeLabel}
                    </span>
                    <h1 className={styles.title}>{title}</h1>
                </div>

                {description && <p className={styles.description}>{description}</p>}

                {meta.length > 0 && (
                    <div className={styles.metaRow}>
                        {meta.map(item => (
                            <span key={item} className={styles.metaDetail}>
                                {item}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.rightAction}>
                {headline && (
                    <span className={styles.headline}>
                        <span className={styles.headlineValue}>{headline.value}</span>
                        <span className={styles.headlineCaption}>{headline.caption}</span>
                    </span>
                )}

                <div className={styles.progressBlock}>
                    {!headline && (
                        <div className={styles.progressTextRow}>
                            <span>{progressLabel}</span>
                            <span className={styles.progressVal}>{progressPercent}%</span>
                        </div>
                    )}
                    <div
                        className={styles.progressBarTrack}
                        role="progressbar"
                        aria-valuenow={progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={progressAriaLabel ?? `${title} progress`}
                    >
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {actionLabel && onAction && (
                    <button type="button" className={styles.actionButton} onClick={onAction}>
                        {actionLabel}
                        <i
                            className="fa-solid fa-arrow-right"
                            style={{ marginLeft: '8px', fontSize: '0.85rem' }}
                            aria-hidden="true"
                        />
                    </button>
                )}
            </div>
        </>
    );

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.banner} ${footer ? styles.bannerWithFooter : ''}`.trim()}>
                {footer ? <div className={styles.topRow}>{top}</div> : top}
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </div>
    );
};

export default ContentHeroBanner;
