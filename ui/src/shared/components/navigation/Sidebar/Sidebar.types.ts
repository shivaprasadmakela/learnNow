export interface SidebarProps {
    isExpanded: boolean;
    activeView: string;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => void;
    isLoggedIn: boolean;
    isPathsActive: boolean;
    onSelectPaths: () => void;
}
