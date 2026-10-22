import type { NextLesson } from '../../../../types';
import type { DashboardBanner } from '../../types';

export interface DashboardHeaderProps {
    banner: DashboardBanner;
    /** Opens the lesson the card names - the card's main action. */
    onOpenLesson: (lesson: NextLesson) => void;
}
