import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from '../AvatarPicker.module.css';

interface ShuffleButtonProps {
    onShuffle: () => void;
}

export const ShuffleButton: React.FC<ShuffleButtonProps> = ({ onShuffle }) => {
    return (
        <button type="button" className={styles.shuffleBtn} onClick={onShuffle}>
            <RefreshCw size={14} />
            <span>Randomize</span>
        </button>
    );
};
