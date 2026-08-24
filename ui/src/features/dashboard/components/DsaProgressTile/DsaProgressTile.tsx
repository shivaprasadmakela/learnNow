import React, { useEffect, useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import styles from './DsaProgressTile.module.css';
import { fetchDsaSummary, type DsaSummary } from '../../../dsa/api/dsa.api';

const ORDER: Array<'EASY' | 'MEDIUM' | 'HARD'> = ['EASY', 'MEDIUM', 'HARD'];
const LABELS = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' } as const;

export interface DsaProgressTileProps {
    onOpenSheet: () => void;
    onOpenProblem: (stepSlug: string, problemSlug: string) => void;
}

/**
 * Sheet progress on the dashboard, with a jump straight to the next unsolved problem.
 *
 * Renders nothing at all when no sheet is published — an empty tile promising a feature that does
 * not exist yet is worse than no tile.
 */
export const DsaProgressTile: React.FC<DsaProgressTileProps> = ({
    onOpenSheet,
    onOpenProblem
}) => {
    const [summary, setSummary] = useState<DsaSummary | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchDsaSummary()
            .then(result => {
                if (!cancelled) setSummary(result);
            })
            .catch(() => {
                /* The dashboard should not fail because one tile could not load. */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (!summary || summary.totalProblems === 0) return null;

    const pct = Math.round((summary.solvedProblems / summary.totalProblems) * 100);

    return (
        <section className={styles.tile}>
            <div className={styles.head}>
                <Layers size={16} color="var(--tech-blue)" />
                <h3 className={styles.title}>DSA sheet</h3>
            </div>

            <div className={styles.headline}>
                <span className={styles.value}>{summary.solvedProblems}</span>
                <span className={styles.total}>/ {summary.totalProblems} solved</span>
            </div>

            <div
                className={styles.bar}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="DSA sheet progress"
            >
                <span className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>

            <div className={styles.split}>
                {ORDER.map(level => (
                    <div key={level} className={styles.splitItem}>
                        <span className={styles.splitLabel}>{LABELS[level]}</span>
                        <span className={styles.splitValue}>
                            {summary.solvedByDifficulty?.[level] ?? 0} /{' '}
                            {summary.totalByDifficulty?.[level] ?? 0}
                        </span>
                    </div>
                ))}
            </div>

            {summary.nextProblemSlug ? (
                <button
                    type="button"
                    className={styles.next}
                    onClick={() =>
                        onOpenProblem(
                            summary.nextProblemStepSlug || 'step',
                            summary.nextProblemSlug as string
                        )
                    }
                >
                    <span style={{ minWidth: 0, flex: 1 }}>
                        <span className={styles.nextLabel}>Pick up here</span>
                        <span className={styles.nextTitle}>{summary.nextProblemTitle}</span>
                    </span>
                    <ArrowRight size={15} />
                </button>
            ) : (
                <button type="button" className={styles.next} onClick={onOpenSheet}>
                    <span style={{ minWidth: 0, flex: 1 }}>
                        <span className={styles.nextLabel}>Every problem solved</span>
                        <span className={styles.nextTitle}>Review the sheet</span>
                    </span>
                    <ArrowRight size={15} />
                </button>
            )}
        </section>
    );
};

export default DsaProgressTile;
