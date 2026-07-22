import React from 'react';
import styles from '../../pages/TopicsPage/TopicsPage.module.css';
import type { ViewModeToggleProps } from './ViewModeToggle.types';

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onViewModeChange }) => {
    return (
        <div className={styles.actionRow} style={{ justifyContent: 'flex-end' }}>
            <div className={styles.toggleGroup}>
                <button
                    className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleBtnActive : ''}`}
                    onClick={() => onViewModeChange('grid')}
                    title="Grid View"
                >
                    <i className="fa-solid fa-table-cells" style={{ fontSize: '0.85rem' }} aria-hidden="true" /> Grid
                </button>
                <button
                    className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
                    onClick={() => onViewModeChange('list')}
                    title="List View"
                >
                    <i className="fa-solid fa-list" style={{ fontSize: '0.85rem' }} aria-hidden="true" /> List
                </button>
            </div>
        </div>
    );
};
