import React from 'react';
import { Check, ExternalLink, Play } from 'lucide-react';
import styles from './ProblemRow.module.css';
import { DifficultyBadge } from '../../../../shared/components/ui/Badge';
import { BookmarkButton } from '../../../notes';
import type { DsaProblemRow } from '../../api/dsa.api';

export interface ProblemRowProps {
    problem: DsaProblemRow;
    onOpen: (slug: string) => void;
    onToggleSolved: (problem: DsaProblemRow) => void;
    onToggleBookmark: (problem: DsaProblemRow) => void;
    /** False for a signed-out visitor: the sheet is readable, but nothing is theirs to tick. */
    canTrack?: boolean;
}

export const ProblemRow: React.FC<ProblemRowProps> = ({
    problem,
    onOpen,
    onToggleSolved,
    onToggleBookmark,
    canTrack = true
}) => {
    const solved = problem.status === 'SOLVED';

    const checkboxClass = [
        styles.checkbox,
        solved ? styles.checkboxSolved : '',
        problem.status === 'ATTEMPTED' ? styles.checkboxAttempted : ''
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={styles.row}>
            <button
                type="button"
                className={`${checkboxClass} ${canTrack ? '' : styles.iconBtnDisabled}`}
                onClick={e => {
                    e.stopPropagation();
                    if (canTrack) onToggleSolved(problem);
                }}
                disabled={!canTrack}
                aria-pressed={solved}
                aria-label={solved ? `Mark ${problem.title} unsolved` : `Mark ${problem.title} solved`}
                title={canTrack ? (solved ? 'Mark unsolved' : 'Mark solved') : 'Sign in to track progress'}
            >
                <Check size={13} strokeWidth={3} />
            </button>

            <div
                className={styles.main}
                onClick={() => onOpen(problem.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpen(problem.slug);
                    }
                }}
                style={{ cursor: 'pointer' }}
            >
                <div className={styles.titleRow}>
                    <span className={styles.title}>
                        {problem.title}
                    </span>
                    <DifficultyBadge difficulty={problem.difficulty} />
                </div>
                <div className={styles.meta}>
                    <span className={styles.timeBadge}>{problem.estimatedMinutes} min</span>
                    {problem.tags.slice(0, 4).map(tag => (
                        <span key={tag} className={styles.tag}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className={styles.actions}>
                <BookmarkButton
                    isBookmarked={problem.bookmarked}
                    onToggle={() => onToggleBookmark(problem)}
                    showLabel={false}
                    disabled={!canTrack}
                    targetNoun="problem"
                    targetName={problem.title}
                    size={16}
                />

                {problem.practiceUrl && (
                    <a
                        className={styles.iconBtn}
                        href={problem.practiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Practice on ${problem.practicePlatform || 'the judge'}`}
                        aria-label={`Practice ${problem.title} on ${problem.practicePlatform || 'the judge'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <ExternalLink size={15} />
                    </a>
                )}

                <button
                    type="button"
                    className={`${styles.playBtn} ${problem.hasVideo ? styles.playBtnActive : styles.playBtnDisabled}`}
                    onClick={e => {
                        e.stopPropagation();
                        if (problem.hasVideo) onOpen(problem.slug);
                    }}
                    disabled={!problem.hasVideo}
                    title={problem.hasVideo ? 'Watch the walkthrough' : 'Video coming soon'}
                    aria-label={problem.hasVideo ? `Watch ${problem.title}` : 'Video coming soon'}
                >
                    <Play size={13} className={styles.playIcon} />
                </button>
            </div>
        </div>
    );
};

export default ProblemRow;
