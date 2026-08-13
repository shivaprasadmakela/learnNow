export interface TopicHeroBannerProps {
    pathTitle: string;
    description?: string;
    managedBy: string;
    activitiesCount: number;
    progressPercent: number;
    onContinueClick: () => void;
}
