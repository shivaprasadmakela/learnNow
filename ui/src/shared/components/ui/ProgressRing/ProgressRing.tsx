import React from 'react';
import styles from './ProgressRing.module.css';

export interface ProgressRingProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    primaryColor?: string;
    trackColor?: string;
    label?: string;
    sublabel?: string;
    className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    percentage,
    size = 120,
    strokeWidth = 10,
    primaryColor = 'var(--tech-blue)',
    trackColor = 'var(--bg-tertiary, #f1f5f9)',
    label,
    sublabel,
    className = ''
}) => {
    const clampedPct = Math.min(100, Math.max(0, Math.round(percentage)));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

    return (
        <div
            className={`${styles.container} ${className}`.trim()}
            style={{ width: size, height: size }}
            role="progressbar"
            aria-valuenow={clampedPct}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className={styles.svg}
            >
                {/* Track circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    stroke={trackColor}
                    fill="none"
                    className={styles.track}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    stroke={primaryColor}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={styles.progress}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <div className={styles.labelContainer}>
                <span className={styles.label}>{label ?? `${clampedPct}%`}</span>
                {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
            </div>
        </div>
    );
};

export default ProgressRing;
