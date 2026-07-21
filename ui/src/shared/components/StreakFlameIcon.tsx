import React from 'react';
import flame0 from '../../assets/flame-streak-0.png';
import flameLow from '../../assets/flame-streak-low.png';
import flameHigh from '../../assets/flame-streak-high.png';

interface StreakFlameIconProps {
    streak: number;
    size?: number;
    className?: string;
}

export const StreakFlameIcon: React.FC<StreakFlameIconProps> = ({
    streak,
    size = 24,
    className = ''
}) => {
    let src = flame0;
    if (streak >= 1 && streak <= 3) {
        src = flameLow;
    } else if (streak > 3) {
        src = flameHigh;
    }

    return (
        <img
            src={src}
            alt={`Streak flame (${streak} days)`}
            className={className}
            style={{
                width: size,
                height: size,
                objectFit: 'contain',
                flexShrink: 0
            }}
        />
    );
};

export default StreakFlameIcon;
