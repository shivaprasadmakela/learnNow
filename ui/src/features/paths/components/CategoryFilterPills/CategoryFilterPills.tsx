import React from 'react';
import styles from '../../styles/PathsPage.module.css';
import type { CategoryFilterPillsProps } from './CategoryFilterPills.types';

/**
 * Text chips, deliberately without icons: the icon used to be a globe for every category but one,
 * so it carried no information and made each chip a 90px card. At this size a dozen fit on a line.
 */
export const CategoryFilterPills: React.FC<CategoryFilterPillsProps> = ({
    categories,
    selectedCategory,
    onSelectCategory
}) => (
    <div className={styles.categoriesRow} role="group" aria-label="Filter paths by category">
        {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
                <button
                    key={cat}
                    type="button"
                    className={`${styles.categoryChip} ${active ? styles.categoryChipActive : ''}`}
                    aria-pressed={active}
                    onClick={() => onSelectCategory(cat)}
                >
                    {cat}
                </button>
            );
        })}
    </div>
);
