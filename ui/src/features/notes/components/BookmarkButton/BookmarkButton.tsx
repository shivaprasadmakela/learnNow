import React from 'react';
import { Bookmark } from 'lucide-react';
import styles from './BookmarkButton.module.css';

interface BookmarkButtonProps {
    isBookmarked: boolean;
    onToggle: () => void;
    showLabel?: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
    isBookmarked,
    onToggle,
    showLabel = true
}) => {
    return (
        <button
            type="button"
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarkBtnActive : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Topic'}
            aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Topic'}
        >
            <Bookmark
                className={styles.bookmarkIcon}
                fill={isBookmarked ? '#f59e0b' : 'none'}
                color={isBookmarked ? '#f59e0b' : 'currentColor'}
            />
            {showLabel && (
                <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            )}
        </button>
    );
};
