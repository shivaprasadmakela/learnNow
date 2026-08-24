import React from 'react';
import { Layers, Play } from 'lucide-react';
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

    return (
        <div className={styles.heroCard}>
            <div className={styles.mainInfo}>
                <div className={styles.badge}>
                    <Layers size={13} aria-hidden="true" />
                    <span>Problem Sheet</span>
                </div>

                <h1 className={styles.title}>{sheet.title}</h1>
                {sheet.description && (
                    <p className={styles.description}>{sheet.description}</p>
                )}

                <div className={styles.difficultyRow}>
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
            </div>

            <div className={styles.progressColumn}>
                <span className={styles.progressHeading}>Your Progress</span>
                <div className={styles.progressCountRow}>
                    <span className={styles.solvedCount}>{sheet.solvedProblems}</span>
                    <span className={styles.totalCount}>/ {sheet.totalProblems}</span>
                </div>
                <span className={styles.solvedSubtitle}>Solved</span>

                <div className={styles.progressBarWrapper}>
                    <div
                        className={styles.progressBarTrack}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="DSA Sheet progress"
                    >
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className={styles.progressPctText}>{pct}%</span>
                </div>

                {sheet.playlistUrl && (
                    <a
                        className={styles.playlistButton}
                        href={sheet.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Play size={14} fill="currentColor" />
                        <span>View Playlist</span>
                    </a>
                )}
            </div>
        </div>
    );
};

export default SheetProgressHeader;
