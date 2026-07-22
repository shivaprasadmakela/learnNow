import React from 'react';
import styles from '../../Navigation.module.css';

interface ThemeToggleProps {
    theme: 'light' | 'dark';
    onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
    return (
        <button
            className={styles.headerIconBtn}
            onClick={onToggle}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
            {theme === 'light' ? (
                <i className="fa-solid fa-moon" style={{ fontSize: '1.15rem' }} aria-hidden="true" />
            ) : (
                <i className="fa-solid fa-sun" style={{ fontSize: '1.15rem' }} aria-hidden="true" />
            )}
        </button>
    );
};
