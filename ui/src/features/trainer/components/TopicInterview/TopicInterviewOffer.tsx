import React, { useEffect, useState } from 'react';
import { Mic, Sparkles, Award } from 'lucide-react';
import { fetchInterviewAvailability, type InterviewAvailability } from '../../api/interview.api';
import { authClient } from '../../../../shared/api/authClient';
import styles from './TopicInterview.module.css';

interface TopicInterviewOfferProps {
    topicId: string;
    topicTitle: string;
    onStartInterview?: () => void;
    className?: string;
}

export const TopicInterviewOffer: React.FC<TopicInterviewOfferProps> = ({
    topicId,
    onStartInterview,
    className
}) => {
    const [availability, setAvailability] = useState<InterviewAvailability | null>(null);
    const [loading, setLoading] = useState(true);
    const token = typeof window !== 'undefined' ? authClient.getToken() : null;

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchInterviewAvailability(topicId)
            .then(res => {
                if (active) setAvailability(res);
            })
            .catch(() => {
                if (active) {
                    setAvailability(token ? { available: true, reason: null, leftThisMonth: 5, left: 5 } : null);
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [topicId, token]);

    // Don't render if this topic has no bank questions
    if (!loading && availability?.reason === 'topic_interview_no_questions') {
        return null;
    }

    const isAuthed = Boolean(token || availability);
    const leftCount = availability?.leftThisMonth ?? availability?.left ?? 5;
    const quotaReached =
        availability?.reason === 'topic_interview_quota_reached' || (availability && leftCount <= 0);
    const voiceUnavailable =
        availability?.reason === 'topic_interview_voice_unavailable';
    const aiUnavailable = availability?.reason === 'ai_unavailable';
    const canStart = !isAuthed || (availability?.available && !quotaReached && !voiceUnavailable && !aiUnavailable);

    const handleStartClick = () => {
        if (!isAuthed) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        onStartInterview?.();
    };

    return (
        <div className={`${styles.offerCard} ${className || ''}`} data-testid="topic-interview-offer">
            <div className={styles.offerHeader}>
                <div className={styles.offerBadgeRow}>
                    <span className={styles.pillBadge}>
                        <Sparkles size={13} />
                        AI Voice Practice
                    </span>
                    <span className={styles.pointsBadge}>
                        <Award size={13} />
                        +15 pts (+10 bonus)
                    </span>
                </div>
                {availability ? (
                    <span className={styles.quotaText}>
                        {leftCount} of 5 left this month
                    </span>
                ) : (
                    <span className={styles.quotaText}>
                        5 practice sessions / month
                    </span>
                )}
            </div>

            <h3 className={styles.offerTitle}>
                <Mic size={18} color="var(--tech-blue)" />
                Practice Topic Interview
            </h3>
            <p className={styles.offerDescription}>
                Test your understanding out loud with the AI interviewer. 3 real questions with follow-ups (~5 mins).
                Get instant feedback on key points, model answers, and speaking habits.
            </p>

            <div className={styles.offerActions}>
                {quotaReached ? (
                    <span className={styles.quotaText} style={{ color: '#f59e0b' }}>
                        Monthly quota completed (5/5). Renews next month.
                    </span>
                ) : voiceUnavailable ? (
                    <span className={styles.quotaText} style={{ color: '#94a3b8' }}>
                        Voice practice temporarily unavailable.
                    </span>
                ) : aiUnavailable ? (
                    <span className={styles.quotaText} style={{ color: '#f59e0b' }}>
                        AI trainer service connecting…
                    </span>
                ) : null}

                <button
                    type="button"
                    className={styles.startBtn}
                    onClick={handleStartClick}
                    disabled={(!canStart && isAuthed) || loading}
                >
                    <Mic size={16} />
                    {loading
                        ? 'Checking availability…'
                        : !isAuthed
                        ? 'Sign in to Practice'
                        : 'Start Practice Interview'}
                </button>
            </div>
        </div>
    );
};
