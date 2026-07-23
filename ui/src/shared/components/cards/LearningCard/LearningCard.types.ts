import React from 'react';

export interface LearningCardProps {
    /** Card display layout: 'grid' (default card layout) or 'list' (horizontal row layout) */
    layout?: 'grid' | 'list';
    /** Label for the top pill badge e.g. "Path", "Course", "Topic" */
    badgeLabel?: string;
    /** Icon for the top pill badge (defaults to dragon/dove icon) */
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
    /** Optional badge color variant ('normal' | 'green' | 'orange') */
    badgeVariant?: 'normal' | 'green' | 'orange';
    /** Optional extra className */
    className?: string;
}
