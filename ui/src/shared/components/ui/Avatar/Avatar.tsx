import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import type { AvatarProps } from './Avatar.types';

export const Avatar: React.FC<AvatarProps> = ({
    avatar,
    seed,
    size = 40,
    className
}) => {
    const avatarSvg = useMemo(() => {
        try {
            const avatarSeed = avatar || seed || 'learnnow';
            return createAvatar(adventurer, { seed: avatarSeed }).toString();
        } catch (e) {
            console.error('Failed to create avatar', e);
            return '';
        }
    }, [avatar, seed]);

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0
            }}
            dangerouslySetInnerHTML={{ __html: avatarSvg }}
        />
    );
};

export default Avatar;
