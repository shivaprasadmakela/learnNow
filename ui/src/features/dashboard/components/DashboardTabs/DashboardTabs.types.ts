export interface DashboardTabsProps {
    activeTab: 'activities' | 'paths';
    setActiveTab?: (tab: 'activities' | 'paths') => void;
}
