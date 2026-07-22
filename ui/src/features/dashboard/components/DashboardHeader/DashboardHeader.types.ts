import type { UserProfile } from '../../../../types';
import type { DashboardBanner, PathProgressSummary } from '../../types';

export interface DashboardHeaderProps {
    profile: UserProfile | null;
    banner: DashboardBanner;
    paths: PathProgressSummary[];
    onSelectPath: (pathId: number) => void;
}
