import React from 'react';
import styles from '../LearningCard.module.css';

interface CardActionArrowProps {
    tooltip?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CardActionArrow: React.FC<CardActionArrowProps> = ({ tooltip = 'Explore', onClick }) => {
    return (
        <button
            type="button"
            className={styles.actionCircleBtn}
            title={tooltip}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
        >
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.9rem' }} aria-hidden="true" />
        </button>
    );
};
