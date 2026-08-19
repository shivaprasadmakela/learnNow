import React from 'react';
import { Check, Sparkles, FileText, Target, Award, ArrowRight } from 'lucide-react';
import styles from './TopicCelebrationModal.module.css';

interface TopicCelebrationModalProps {
    isOpen: boolean;
    topicTitle: string;
    problemsCount: number;
    nextTopicTitle?: string;
    onContinueNextTopic: () => void;
    onClose: () => void;
}

export const TopicCelebrationModal: React.FC<TopicCelebrationModalProps> = ({
    isOpen,
    problemsCount,
    nextTopicTitle,
    onContinueNextTopic
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modalCard}>
                {/* Top Badge Icon with Sparkles */}
                <div className={styles.iconWrapper}>
                    <div className={styles.iconRingBg} />
                    <Sparkles size={20} className={styles.sparkle1} />
                    <Sparkles size={16} className={styles.sparkle2} />
                    <div className={styles.iconCircle}>
                        <Check size={32} strokeWidth={3} />
                    </div>
                </div>

                {/* Title and Subtitle */}
                <h2 className={styles.title}>Topic Complete!</h2>
                <p className={styles.subtitle}>
                    Great job completing the topic! Your accuracy is solid—keep challenging yourself and aiming higher.
                </p>

                {/* 3 Stat Cards Row */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <div className={styles.statValueRow}>
                            <FileText size={15} className={styles.statIcon} />
                            <span>{problemsCount}</span>
                        </div>
                        <span className={styles.statLabel}>Problems</span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statValueRow}>
                            <Target size={15} className={styles.statIcon} />
                            <span>100%</span>
                        </div>
                        <span className={styles.statLabel}>Accuracy</span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statValueRow}>
                            <Award size={15} className={styles.statIcon} />
                            <span>+5</span>
                        </div>
                        <span className={styles.statLabel}>Gems</span>
                    </div>
                </div>

                {/* Primary Action Button */}
                <button
                    type="button"
                    className={styles.continueBtn}
                    onClick={onContinueNextTopic}
                >
                    <span>
                        {nextTopicTitle
                            ? `Continue with ${nextTopicTitle}`
                            : 'Continue to Next Topic'}
                    </span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default TopicCelebrationModal;
