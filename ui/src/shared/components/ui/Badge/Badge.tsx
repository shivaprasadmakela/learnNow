import React from 'react';
import type { LevelBadgeProps, TrackBadgeProps, DifficultyBadgeProps, DurationBadgeProps, ReusableBadgeProps } from './Badge.types';
import styles from './Badge.module.css';

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level = 'beginner', className = '' }) => {
    const norm = (level || 'beginner').toLowerCase();

    let styleClass = styles.levelBeginner;
    let label = 'Beginner';

    if (norm === 'intermediate') {
        styleClass = styles.levelIntermediate;
        label = 'Intermediate';
    } else if (norm === 'advanced') {
        styleClass = styles.levelAdvanced;
        label = 'Advanced';
    }

    return (
        <span className={`${styles.badge} ${styleClass} ${className}`}>
            <span className={styles.badgeIcon}>
                <i className="fa-solid fa-layer-group" aria-hidden="true" />
            </span>
            <span>{label}</span>
        </span>
    );
};

export const TrackBadge: React.FC<TrackBadgeProps> = ({ track = 'concept', className = '' }) => {
    const norm = (track || 'concept').toLowerCase().replace('-', ' ');
    const isHandsOn = norm.includes('hands');

    const styleClass = isHandsOn ? styles.trackHandsOn : styles.trackConcept;
    const label = isHandsOn ? 'Hands-on' : 'Concept';
    const iconClass = isHandsOn ? 'fa-solid fa-laptop-code' : 'fa-solid fa-lightbulb';

    return (
        <span className={`${styles.badge} ${styleClass} ${className}`}>
            <span className={styles.badgeIcon}>
                <i className={iconClass} aria-hidden="true" />
            </span>
            <span>{label}</span>
        </span>
    );
};

export const DurationBadge: React.FC<DurationBadgeProps> = ({ minutes = 5, className = '' }) => {
    const mins = typeof minutes === 'number' ? minutes : parseInt(String(minutes), 10) || 5;

    return (
        <span className={`${styles.badge} ${styles.durationBadge} ${className}`}>
            <span className={styles.badgeIcon}>
                <i className="fa-solid fa-clock" aria-hidden="true" />
            </span>
            <span>{mins} min read</span>
        </span>
    );
};

export const ReusableBadge: React.FC<ReusableBadgeProps> = ({ label, icon, variant = 'default', className = '' }) => {
    let variantClass = styles.badge;
    if (variant === 'green') variantClass = `${styles.badge} ${styles.levelBeginner}`;
    if (variant === 'orange') variantClass = `${styles.badge} ${styles.levelIntermediate}`;
    if (variant === 'blue') variantClass = `${styles.badge} ${styles.trackConcept}`;
    if (variant === 'purple') variantClass = `${styles.badge} ${styles.trackHandsOn}`;

    return (
        <span className={`${variantClass} ${className}`}>
            {icon && <span className={styles.badgeIcon}>{icon}</span>}
            <span>{label}</span>
        </span>
    );
};

/**
 * Problem difficulty.
 *
 * Sibling of {@link LevelBadge} rather than a variant of it: a topic's beginner/intermediate/
 * advanced and a problem's easy/medium/hard are different vocabularies for different things, and
 * collapsing them would mean one component with two label maps and a mode flag.
 *
 * The hues are deliberately not the brand blue - difficulty is information the learner scans for,
 * so it earns semantic colour.
 */
export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
    difficulty = 'EASY',
    className = ''
}) => {
    const norm = String(difficulty).toUpperCase();

    const styleClass =
        norm === 'HARD'
            ? styles.difficultyHard
            : norm === 'MEDIUM'
              ? styles.difficultyMedium
              : styles.difficultyEasy;

    const label = norm.charAt(0) + norm.slice(1).toLowerCase();

    return <span className={`${styles.difficultyBadge} ${styleClass} ${className}`.trim()}>{label}</span>;
};
