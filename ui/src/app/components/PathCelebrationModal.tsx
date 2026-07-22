import React from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';
import styles from '../App.module.css';
import type { Course } from '../../types';

interface PathCelebrationModalProps {
    path: Course | null;
    onClose: () => void;
}

export const PathCelebrationModal: React.FC<PathCelebrationModalProps> = ({ path, onClose }) => {
    if (!path) return null;

    return (
        <div className={styles.celebrationOverlay} onClick={onClose}>
            <div className={styles.celebrationModal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={18} />
                </button>
                <div className={styles.celebrationIconBox}>
                    <Trophy size={48} className={styles.trophyIcon} />
                    <Sparkles size={24} className={styles.sparkleIcon1} />
                    <Sparkles size={20} className={styles.sparkleIcon2} />
                </div>
                <h2 className={styles.celebrationTitle}>Path Completed!</h2>
                <p className={styles.celebrationMessage}>
                    Congratulations! You've mastered all topics in <strong>{path.title}</strong>!
                </p>
                <div className={styles.bonusBadge}>+100 Bonus XP Awarded 🎉</div>
                <button className={styles.continueBtn} onClick={onClose}>
                    Keep Learning
                </button>
            </div>
        </div>
    );
};

export default PathCelebrationModal;
