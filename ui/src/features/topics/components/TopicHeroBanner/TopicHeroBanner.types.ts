import type React from 'react';

export interface TopicHeroBannerProps {
    pathTitle: string;
    description?: string;
    managedBy: string;
    activitiesCount: number;
    progressPercent: number;
    onContinueClick: () => void;
    /** Under the banner's divider: the career tracks this path is part of. */
    footer?: React.ReactNode;
}
