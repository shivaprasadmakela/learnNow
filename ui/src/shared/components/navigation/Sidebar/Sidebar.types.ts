import type { UserProfile } from '../../../../types';

export interface SidebarProps {
    isExpanded: boolean;
    activeView: string;
    changeView: (view: any) => void;
    isLoggedIn: boolean;
    isPathsActive: boolean;
    onSelectPaths: () => void;
    /** True while any DSA view is showing. Separate from isPathsActive, which tracks courses. */
    isDsaActive?: boolean;
    onSelectDsa?: () => void;
    profile?: UserProfile | null;
    setIsExpanded?: (isExpanded: boolean) => void;
    onOpenDonationModal?: () => void;
}
