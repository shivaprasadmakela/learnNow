import React from 'react';
import type { BouncingVariant } from './bouncingVariants';
import styles from './BouncingLoader.module.css';

export interface BouncingLoaderProps {
    variant: BouncingVariant;
    /** The moving part. Usually the accent of the current time of day. */
    ballColor: string;
    /** The structure around it. Defaults to the theme's border colour. */
    frameColor?: string;
    /** Makes the whole thing a button. Omit it and the animation is inert decoration. */
    onClick?: () => void;
    /** Describes what clicking does, for anyone not seeing the animation. */
    label?: string;
}

/**
 * The animation shown while the backend wakes up.
 *
 * <p>Five variants, all pure CSS and all built the same way: a frame, and a ball bouncing within
 * it. They took the place of three GIFs, which is worth stating plainly — a loading screen that
 * has to download a few hundred kilobytes before it can show you anything is waiting on the very
 * network it exists to apologise for, and on a cold start those requests queue behind everything
 * else. These need nothing.
 *
 * <p>When {@code onClick} is given it renders as a real button, so cycling the animation works
 * from the keyboard too. That is the whole of the interaction: something to fiddle with during a
 * twenty second wait, which is a better use of the time than watching one loop repeat.
 */
export const BouncingLoader: React.FC<BouncingLoaderProps> = ({
    variant,
    ballColor,
    frameColor,
    onClick,
    label
}) => {
    const style = {
        '--loader-ball': ballColor,
        '--loader-frame': frameColor ?? 'var(--text-tertiary, #94a3b8)'
    } as React.CSSProperties;

    const className = `${styles.stage} ${styles[variant]}`;

    if (!onClick) {
        return <div className={className} style={style} aria-hidden="true" />;
    }

    return (
        <button
            type="button"
            className={className}
            style={style}
            onClick={onClick}
            aria-label={label ?? 'Change the animation'}
            title={label ?? 'Change the animation'}
        />
    );
};

export default BouncingLoader;
