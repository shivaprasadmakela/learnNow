import React from 'react';

export type LevelType = 'beginner' | 'intermediate' | 'advanced' | string;
export type TrackType = 'concept' | 'hands-on' | string;

export interface LevelBadgeProps {
    level?: LevelType;
    className?: string;
}

export interface TrackBadgeProps {
    track?: TrackType;
    className?: string;
}

export interface DurationBadgeProps {
    minutes?: number | string;
    className?: string;
}

export interface ReusableBadgeProps {
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'green' | 'orange' | 'blue' | 'purple';
    className?: string;
}
