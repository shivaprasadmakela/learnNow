import React from 'react';
import { Layers, Video } from 'lucide-react';
import { ContentHeroBanner } from '../../../../shared/components/ui/ContentHeroBanner';
import styles from './SheetProgressHeader.module.css';
import type { DsaSheetDetail } from '../../api/dsa.api';

const ORDER: Array<'EASY' | 'MEDIUM' | 'HARD'> = ['EASY', 'MEDIUM', 'HARD'];
const LABELS = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' } as const;

/**
 * The sheet's banner.
 *
 * The same component the Paths module uses, so the two landing pages read as one product. Two
 * things are specific to a sheet and go in its slots: the headline is a solved count rather than a
 * percentage, because on a 450-problem sheet the count is what a learner is tracking; and the
 * per-difficulty breakdown sits in the footer, where it can grow without crowding the title.
 */
export const SheetProgressHeader: React.FC<{ sheet: DsaSheetDetail }> = ({ sheet }) => {
    const pct =
        sheet.totalProblems > 0
            ? Math.round((sheet.solvedProblems / sheet.totalProblems) * 100)
            : 0;

    return (
        <ContentHeroBanner
            badgeLabel="Problem sheet"
            badgeIcon={<Layers size={12} aria-hidden="true" />}
            title={sheet.title}
            description={sheet.description}
            progressPercent={pct}
            progressAriaLabel="Sheet progress"
            headline={{
                value: sheet.solvedProblems,
                caption: `/ ${sheet.totalProblems} solved`
            }}
            footer={
                <>
                    {ORDER.map(level => (
                        <span key={level} className={styles.splitItem}>
                            <span className={styles.splitLabel}>{LABELS[level]}</span>
                            <span className={styles.splitValue}>
                                {sheet.solvedByDifficulty?.[level] ?? 0} /{' '}
                                {sheet.totalByDifficulty?.[level] ?? 0}
                            </span>
                        </span>
                    ))}

                    {sheet.playlistUrl && (
                        <a
                            className={styles.playlist}
                            href={sheet.playlistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Video size={15} /> Full playlist
                        </a>
                    )}
                </>
            }
        />
    );
};

export default SheetProgressHeader;
