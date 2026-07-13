import React from 'react';
import { Home } from 'lucide-react';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
    /** Display label. If omitted, renders the home icon instead. */
    label?: string;
    /** If provided, this crumb is clickable */
    onClick?: () => void;
}

interface BreadcrumbProps {
    /** Ordered list of crumb items. Last item is treated as active (non-clickable). */
    crumbs: BreadcrumbItem[];
    /** Optional content rendered to the far right of the bar (e.g. banner + button) */
    rightSlot?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ crumbs, rightSlot }) => {
    return (
        <div className={styles.breadcrumbBar}>
            <nav className={styles.pathsBreadcrumb} aria-label="Breadcrumb">
                {crumbs.map((crumb, index) => {
                    const isFirst = index === 0;
                    const isLast = index === crumbs.length - 1;

                    return (
                        <React.Fragment key={index}>
                            {/* Divider before every crumb except the first */}
                            {!isFirst && (
                                <span className={styles.breadcrumbDivider} aria-hidden="true">›</span>
                            )}

                            {isLast ? (
                                /* Active (current page) crumb — not clickable */
                                <span className={styles.breadcrumbActive} aria-current="page">
                                    {crumb.label}
                                </span>
                            ) : crumb.onClick ? (
                                /* Clickable link crumb */
                                <span
                                    className={styles.breadcrumbLink}
                                    onClick={crumb.onClick}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && crumb.onClick?.()}
                                >
                                    {crumb.label ?? <Home size={15} />}
                                </span>
                            ) : (
                                /* Non-clickable, non-active crumb */
                                <span className={styles.breadcrumbText}>
                                    {crumb.label ?? <Home size={15} />}
                                </span>
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>

            {rightSlot && (
                <div className={styles.breadcrumbRight}>
                    {rightSlot}
                </div>
            )}
        </div>
    );
};
