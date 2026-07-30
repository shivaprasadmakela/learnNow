export interface DashboardTabsProps {
    activeTab: 'activities' | 'paths' | 'bookmarks';
    setActiveTab?: (tab: 'activities' | 'paths' | 'bookmarks') => void;
}
