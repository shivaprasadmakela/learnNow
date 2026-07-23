import type { UserProfile } from '../../../../types';

export interface SidebarProps {
    isExpanded: boolean;
    activeView: string;
    changeView: (view: any) => void;
    isLoggedIn: boolean;
    isPathsActive: boolean;
    onSelectPaths: () => void;
    profile?: UserProfile | null;
}
