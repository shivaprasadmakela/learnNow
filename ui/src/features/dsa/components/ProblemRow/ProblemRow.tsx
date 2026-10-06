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

/**
 * One problem in the sheet.
 *
 * <p>Laid out as a table row rather than a left-aligned stack, because that is how the list is
 * actually used: nobody reads a 133-problem sheet top to bottom, they scan down one column looking
 * for the next unsolved Easy, or for the one they bookmarked. The previous layout put the
 * difficulty immediately after the title, so its position moved with the length of every title and
 * the one attribute people scan for could not be scanned at all. It also gave the title cell all
 * the free space, which on a wide monitor left a corridor of nothing between the tags and the
 * buttons.
 *
 * <p>So the columns to the right of the title are fixed, and line up down the page: time,
 * difficulty, actions. The title cell takes the slack and truncates. Whitespace in the middle now
 * reads as a table rather than as a gap.
 *
 * <p>Each action keeps its slot whether or not the problem has that action. A row with a video and
 * a row without are the same shape, so the icons form a column instead of shuffling left and right
 * as you scan down.
 */
export const ProblemRow: React.FC<ProblemRowProps> = ({
    problem,
    onOpen,
    onToggleSolved,
    onToggleBookmark,
    canTrack = true
}) => {
    const solved = problem.status === 'SOLVED';
    const attempted = problem.status === 'ATTEMPTED';

    const open = () => onOpen(problem.slug);

    return (
        <div className={`${styles.row} ${solved ? styles.rowSolved : ''}`.trim()}>
            <button
                type="button"
                className={[
                    styles.checkbox,
                    solved ? styles.checkboxSolved : '',
                    attempted ? styles.checkboxAttempted : '',
                    canTrack ? '' : styles.checkboxLocked
                ]
                    .filter(Boolean)
                    .join(' ')}
                onClick={e => {
                    e.stopPropagation();
                    if (canTrack) onToggleSolved(problem);
                }}
                disabled={!canTrack}
                aria-pressed={solved}
                aria-label={
                    solved ? `Mark ${problem.title} unsolved` : `Mark ${problem.title} solved`
                }
                title={
                    canTrack
                        ? solved
                            ? 'Mark unsolved'
                            : 'Mark solved'
                        : 'Sign in to track progress'
                }
            >
                <Check size={13} strokeWidth={3} />
            </button>

            <button type="button" className={styles.main} onClick={open}>
                <span className={styles.title}>{problem.title}</span>
                {problem.tags.length > 0 && (
                    <span className={styles.tags}>
                        {problem.tags.slice(0, 3).map(tag => (
                            <span key={tag} className={styles.tag}>
                                {tag}
                            </span>
                        ))}
                    </span>
                )}
            </button>

            <span className={styles.time}>{problem.estimatedMinutes}m</span>

            <span className={styles.difficulty}>
                <DifficultyBadge difficulty={problem.difficulty} />
            </span>

            <div className={styles.actions}>
                <span className={styles.slot}>
                    <BookmarkButton
                        isBookmarked={problem.bookmarked}
                        onToggle={() => onToggleBookmark(problem)}
                        showLabel={false}
                        disabled={!canTrack}
                        targetNoun="problem"
                        targetName={problem.title}
                        size={16}
                    />
                </span>

                {/* Empty slots are kept so every row is the same shape. See the class note. */}
                <span className={`${styles.slot} ${styles.practiceSlot}`}>
                    {problem.practiceUrl && (
                        <a
                            className={styles.iconBtn}
                            href={problem.practiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Practice on ${problem.practicePlatform || 'the judge'}`}
                            aria-label={`Practice ${problem.title} on ${
                                problem.practicePlatform || 'the judge'
                            }`}
                            onClick={e => e.stopPropagation()}
                        >
                            <ExternalLink size={15} />
                        </a>
                    )}
                </span>

                <span className={styles.slot}>
                    {problem.hasVideo && (
                        <button
                            type="button"
                            className={styles.playBtn}
                            onClick={e => {
                                e.stopPropagation();
                                open();
                            }}
                            title="Watch the walkthrough"
                            aria-label={`Watch ${problem.title}`}
                        >
                            <Play size={12} className={styles.playIcon} />
                        </button>
                    )}
                </span>
            </div>
        </div>
    );
};

export default ProblemRow;
