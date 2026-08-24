import React from 'react';
import styles from '../../Navigation.module.css';

export const EncouragementWidget: React.FC = () => {
    return (
        <div className={styles.encouragementWidget}>
            <div className={styles.encouragementText}>
                <span className={styles.encouragementTitle}>Keep going!</span>
                <span className={styles.encouragementSubtitle}>You're doing great</span>
            </div>
            <div className={styles.encouragementGraphic}>
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.plantSvg}
                    aria-hidden="true"
                >
                    {/* Plant pot */}
                    <path
                        d="M20 40 L24 56 C24.5 58 26 59 28 59 L36 59 C38 59 39.5 58 40 56 L44 40 Z"
                        fill="var(--tech-blue)"
                        opacity="0.85"
                    />
                    <path
                        d="M18 37 C18 35.5 19 35 21 35 L43 35 C45 35 46 35.5 46 37 C46 38.5 45 39 43 39 L21 39 C19 39 18 38.5 18 37 Z"
                        fill="var(--tech-blue-active, #003e67)"
                    />
                    {/* Plant stem & leaves */}
                    <path
                        d="M32 35 C32 25 32 15 32 10"
                        stroke="var(--tech-green, #22c55e)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    {/* Left leaf */}
                    <path
                        d="M32 26 C24 24 16 28 16 16 C26 16 30 22 32 26 Z"
                        fill="var(--tech-green, #22c55e)"
                        opacity="0.9"
                    />
                    {/* Right leaf */}
                    <path
                        d="M32 20 C40 18 48 22 48 10 C38 10 34 16 32 20 Z"
                        fill="var(--tech-green, #22c55e)"
                    />
                    {/* Center top leaf */}
                    <path
                        d="M32 14 C30 8 32 4 32 4 C32 4 34 8 32 14 Z"
                        fill="var(--tech-green, #22c55e)"
                        opacity="0.8"
                    />
                </svg>
            </div>
        </div>
    );
};

export default EncouragementWidget;
