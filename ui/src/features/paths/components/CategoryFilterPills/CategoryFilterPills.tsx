import React from 'react';
import styles from '../../styles/PathsPage.module.css';
import type { CategoryFilterPillsProps } from './CategoryFilterPills.types';

export const CategoryFilterPills: React.FC<CategoryFilterPillsProps> = ({
    categories,
    selectedCategory,
    onSelectCategory
}) => {
    const getCategoryIcon = (category: string) => {
        if (category === 'Backend') {
            return <i className="fa-solid fa-code" style={{ fontSize: '1rem' }} aria-hidden="true" />;
        }
        return <i className="fa-solid fa-globe" style={{ fontSize: '1rem' }} aria-hidden="true" />;
    };

    return (
        <div className={styles.categoriesRow} style={{ justifyContent: 'center', marginBottom: '32px' }}>
            {categories.map((cat) => (
                <button
                    key={cat}
                    type="button"
                    className={`${styles.categoryItem} ${selectedCategory === cat ? styles.categoryItemActive : ''}`}
                    onClick={() => onSelectCategory(cat)}
                >
                    <div className={styles.categoryIcon}>
                        {getCategoryIcon(cat)}
                    </div>
                    <span className={styles.categoryLabel}>{cat}</span>
                </button>
            ))}
        </div>
    );
};
