export type DashboardTabId = 'activities' | 'paths' | 'bookmarks';

export interface DashboardTabsProps {
    activeTab: DashboardTabId;
    setActiveTab?: (tab: DashboardTabId) => void;
}
