import React from 'react';
import styles from './CourseDetailsPanel.module.css';
import { PATH_CATEGORIES, isPathCategory } from '../../../../../shared/utils/pathCategories';

interface CourseDetailsPanelProps {
    title: string;
    onTitleChange: (v: string) => void;
    description: string;
    onDescriptionChange: (v: string) => void;
    category: string;
    onCategoryChange: (v: string) => void;
    managedBy: string;
    onManagedByChange: (v: string) => void;
}

export const CourseDetailsPanel: React.FC<CourseDetailsPanelProps> = ({
    title,
    onTitleChange,
    description,
    onDescriptionChange,
    category,
    onCategoryChange,
    managedBy,
    onManagedByChange,
}) => (
    <section className={styles.panel}>
        <h3 className={styles.panelTitle}>
            <i className="fa-solid fa-dragon" style={{ marginRight: '8px' }} aria-hidden="true" />
            Course Details
        </h3>

        <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="course-title">Course Title</label>
            <input
                id="course-title"
                type="text"
                className={styles.inputField}
                value={title}
                onChange={e => onTitleChange(e.target.value)}
                placeholder="e.g. System Architecture & Cloud Native Java"
            />
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="course-category">Category</label>
                <select
                    id="course-category"
                    className={styles.inputField}
                    value={category}
                    onChange={e => onCategoryChange(e.target.value)}
                >
                    {/* A path saved before the list existed can hold anything. Show it as it is
                        rather than letting the select silently display the first option. */}
                    {!isPathCategory(category) && (
                        <option value={category} disabled>
                            {category ? `${category} - no longer valid, choose one` : 'Choose a category'}
                        </option>
                    )}
                    {PATH_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="course-managed-by">Managed By</label>
                <input
                    id="course-managed-by"
                    type="text"
                    className={styles.inputField}
                    value={managedBy}
                    onChange={e => onManagedByChange(e.target.value)}
                    placeholder="e.g. learnNow"
                />
            </div>
        </div>

        <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="course-description">Description</label>
            <textarea
                id="course-description"
                className={styles.textAreaField}
                value={description}
                onChange={e => onDescriptionChange(e.target.value)}
                placeholder="Detailed description of what learners will gain from this path..."
            />
        </div>
    </section>
);
