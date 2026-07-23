import React from 'react';
import { Avatar } from '../../../../../../shared/components/ui/Avatar';
import { ShuffleButton } from './components/ShuffleButton';
import styles from './AvatarPicker.module.css';

interface AvatarPickerProps {
    avatar: string;
    onChangeAvatar: (avatar: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
    avatar,
    onChangeAvatar
}) => {
    const handleShuffle = () => {
        const newAvatarSeed = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now());
        onChangeAvatar(newAvatarSeed);
    };

    return (
        <div className={styles.container}>
            <div className={styles.previewHeader}>
                <div className={styles.previewLeft}>
                    <Avatar avatar={avatar} size={56} />
                    <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Adventurer Avatar</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Click randomize to generate a new character
                        </span>
                    </div>
                </div>
                <ShuffleButton onShuffle={handleShuffle} />
            </div>
        </div>
    );
};
