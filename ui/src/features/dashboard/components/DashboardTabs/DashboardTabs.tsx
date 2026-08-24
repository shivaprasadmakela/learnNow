import React from 'react';
import { Tabs, type TabItem } from '../../../../shared/components/ui/Tabs';
import type { DashboardTabsProps, DashboardTabId } from './DashboardTabs.types';

const ITEMS: TabItem<DashboardTabId>[] = [
    { id: 'activities', label: 'Recent Activity' },
    { id: 'paths', label: 'Learning Paths' },
    { id: 'bookmarks', label: 'Bookmarks' }
];

/**
 * The dashboard's section switcher.
 *
 * Kept as a named component rather than inlining `Tabs` at the call site, because the three
 * sections are a fixed part of the dashboard's shape and naming them here keeps that in one place.
 * The rendering, keyboard handling and ARIA all come from the shared component.
 */
export const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, setActiveTab }) => (
    <Tabs
        items={ITEMS}
        activeId={activeTab}
        onChange={id => setActiveTab?.(id)}
        variant="underline"
        label="Dashboard sections"
    />
);

export default DashboardTabs;
