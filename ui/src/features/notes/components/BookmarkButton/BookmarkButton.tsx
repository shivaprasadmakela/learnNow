import React from 'react';
import { Bookmark } from 'lucide-react';
import styles from './BookmarkButton.module.css';

export interface BookmarkButtonProps {
    isBookmarked: boolean;
    onToggle: () => void;
    /** With the label it reads as a button; without, as an icon control in a dense row. */
    showLabel?: boolean;
    /**
     * What is being bookmarked, for the tooltip and the accessible name. Was hardcoded to "Topic",
     * which read wrong the moment problems became bookmarkable too.
     */
    targetNoun?: string;
    /** Names the specific thing, so a list of these is distinguishable to a screen reader. */
    targetName?: string;
    size?: number;
    disabled?: boolean;
    className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
    isBookmarked,
    onToggle,
    showLabel = true,
    targetNoun = 'item',
    targetName,
    size = 16,
    disabled = false,
    className = ''
}) => {
    const what = targetName ? `${targetNoun} ${targetName}` : targetNoun;
    const description = isBookmarked ? `Remove the bookmark on this ${what}` : `Bookmark this ${what}`;

    return (
        <button
            type="button"
            className={[
                styles.bookmarkBtn,
                showLabel ? '' : styles.iconOnly,
                isBookmarked ? styles.bookmarkBtnActive : '',
                className
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={event => {
                // Rows are clickable, so a bookmark click must not also open the row.
                event.stopPropagation();
                onToggle();
            }}
            disabled={disabled}
            title={description}
            aria-label={description}
            aria-pressed={isBookmarked}
        >
            <Bookmark
                className={styles.bookmarkIcon}
                style={{ width: size, height: size }}
                fill={isBookmarked ? 'currentColor' : 'none'}
            />
            {showLabel && <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>}
        </button>
    );
};

export default BookmarkButton;
