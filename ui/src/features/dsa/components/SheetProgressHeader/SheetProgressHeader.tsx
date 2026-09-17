import React from 'react';
import { Layers, Play } from 'lucide-react';
import { ContentHeroBanner } from '../../../../shared/components/ui/ContentHeroBanner';
import styles from './SheetProgressHeader.module.css';
import type { DsaSheetDetail } from '../../api/dsa.api';

export const SheetProgressHeader: React.FC<{ sheet: DsaSheetDetail }> = ({ sheet }) => {
    const pct =
        sheet.totalProblems > 0
            ? Math.round((sheet.solvedProblems / sheet.totalProblems) * 100)
            : 0;

    const easySolved = sheet.solvedByDifficulty?.EASY ?? 0;
    const easyTotal = sheet.totalByDifficulty?.EASY ?? 0;
    const medSolved = sheet.solvedByDifficulty?.MEDIUM ?? 0;
    const medTotal = sheet.totalByDifficulty?.MEDIUM ?? 0;
    const hardSolved = sheet.solvedByDifficulty?.HARD ?? 0;
    const hardTotal = sheet.totalByDifficulty?.HARD ?? 0;

    const footer = (
        <div className={styles.footerRow}>
            <div className={styles.difficultyGroup}>
                <div className={styles.diffPill}>
                    <span className={`${styles.dot} ${styles.dotEasy}`} />
                    <span className={styles.diffLabel}>Easy</span>
                    <span className={styles.diffCount}>{easySolved} / {easyTotal}</span>
                </div>

                <div className={styles.diffPill}>
                    <span className={`${styles.dot} ${styles.dotMedium}`} />
                    <span className={styles.diffLabel}>Medium</span>
                    <span className={styles.diffCount}>{medSolved} / {medTotal}</span>
                </div>

                <div className={styles.diffPill}>
                    <span className={`${styles.dot} ${styles.dotHard}`} />
                    <span className={styles.diffLabel}>Hard</span>
                    <span className={styles.diffCount}>{hardSolved} / {hardTotal}</span>
                </div>
            </div>

            {sheet.playlistUrl && (
                <a
                    className={styles.playlistButton}
                    href={sheet.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Play size={12} fill="currentColor" />
                    <span>View Playlist</span>
                </a>
            )}
        </div>
    );

    return (
        <ContentHeroBanner
            badgeLabel="Problem Sheet"
            badgeIcon={<Layers size={13} style={{ marginRight: '2px' }} aria-hidden="true" />}
            title={sheet.title}
            description={sheet.description}
            progressPercent={pct}
            headline={{
                value: `${sheet.solvedProblems} / ${sheet.totalProblems}`,
                caption: 'Solved'
            }}
            footer={footer}
        />
    );
};

export default SheetProgressHeader;
