import React from 'react';
import { Check, Video, ExternalLink } from 'lucide-react';
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
                onClick={() => canTrack && onToggleSolved(problem)}
                disabled={!canTrack}
                aria-pressed={solved}
                aria-label={solved ? `Mark ${problem.title} unsolved` : `Mark ${problem.title} solved`}
                title={canTrack ? (solved ? 'Mark unsolved' : 'Mark solved') : 'Sign in to track progress'}
            >
                <Check size={14} strokeWidth={3} />
            </button>

            <div className={styles.main}>
                <div className={styles.titleRow}>
                    <button
                        type="button"
                        className={styles.title}
                        onClick={() => onOpen(problem.slug)}
                    >
                        {problem.title}
                    </button>
                    <DifficultyBadge difficulty={problem.difficulty} />
                </div>
                <div className={styles.meta}>
                    <span>{problem.estimatedMinutes} min</span>
                    {problem.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={styles.tag}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className={styles.actions}>
                {/*
                  Rendered even without a video, but visibly inert. A row that silently loses a
                  control depending on content makes the list look ragged; a dimmed one reads as
                  "not yet".
                */}
                <button
                    type="button"
                    className={`${styles.iconBtn} ${problem.hasVideo ? '' : styles.iconBtnDisabled}`}
                    onClick={() => problem.hasVideo && onOpen(problem.slug)}
                    disabled={!problem.hasVideo}
                    title={problem.hasVideo ? 'Watch the walkthrough' : 'Video coming soon'}
                    aria-label={problem.hasVideo ? `Watch ${problem.title}` : 'Video coming soon'}
                >
                    <Video size={16} />
                </button>

                {problem.practiceUrl && (
                    <a
                        className={styles.iconBtn}
                        href={problem.practiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Practice on ${problem.practicePlatform || 'the judge'}`}
                        aria-label={`Practice ${problem.title} on ${problem.practicePlatform || 'the judge'}`}
                    >
                        <ExternalLink size={15} />
                    </a>
                )}

                <BookmarkButton
                    isBookmarked={problem.bookmarked}
                    onToggle={() => onToggleBookmark(problem)}
                    showLabel={false}
                    disabled={!canTrack}
                    targetNoun="problem"
                    targetName={problem.title}
                    size={15}
                />
            </div>
        </div>
    );
};

export default ProblemRow;
