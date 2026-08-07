import type { UserProfile, Course } from '../../../../types';
import type { DashboardBanner, PathProgressSummary } from '../../types';

export interface DashboardHeaderProps {
    profile: UserProfile | null;
    banner: DashboardBanner;
    paths?: PathProgressSummary[];
    courses?: Course[];
    onSelectPath: (pathId: number) => void;
}
