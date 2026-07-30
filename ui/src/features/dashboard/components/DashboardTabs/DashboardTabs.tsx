import React from 'react';
import styles from '../../styles/Dashboard.module.css';
import type { DashboardTabsProps } from './DashboardTabs.types';

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className={styles.tabContainer}>
            <button
                type="button"
                className={`${styles.tabLink} ${activeTab === 'activities' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab && setActiveTab('activities')}
            >
                Recent Activity
            </button>
            <button
                type="button"
                className={`${styles.tabLink} ${activeTab === 'paths' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab && setActiveTab('paths')}
            >
                Learning Paths
            </button>
            <button
                type="button"
                className={`${styles.tabLink} ${activeTab === 'bookmarks' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab && setActiveTab('bookmarks')}
            >
                Bookmarks
            </button>
        </div>
    );
};
