import React, { useMemo, useState } from 'react';
import { Eye, Lock } from 'lucide-react';
import styles from './EditorialPanel.module.css';
import { ContentRenderer } from '../../../../shared/components/content-renderer';
import type { DsaApproach } from '../../api/dsa.api';

const KIND_LABELS: Record<string, string> = {
    BRUTE: 'Brute force',
    BETTER: 'Better',
    OPTIMAL: 'Optimal'
};

export interface EditorialPanelProps {
    approaches: DsaApproach[];
    onOpenFullCompiler?: (code: string, language: string) => void;
}

/**
 * Our written solution, revealed in order.
 *
 * The gating is pedagogical rather than commercial: the reference sheet locks its editorial behind a
 * subscription, we lock it behind having looked at the cheaper approach first. Reading why brute
 * force is O(n²) is most of the value of being told the optimal answer, and a learner who jumps
 * straight to the bottom skips it.
 */
export const EditorialPanel: React.FC<EditorialPanelProps> = ({
    approaches,
    onOpenFullCompiler
}) => {
    const sorted = useMemo(
        () => [...approaches].sort((a, b) => a.orderIndex - b.orderIndex),
        [approaches]
    );

    const [unlocked, setUnlocked] = useState(0);
    const [active, setActive] = useState(0);

    if (sorted.length === 0) {
        return (
            <div className={styles.panel}>
                <p className={styles.empty}>
                    The written solution for this problem is still being drafted.
                </p>
            </div>
        );
    }

    const approach = sorted[Math.min(active, unlocked)];
    const isLocked = unlocked === 0;

    const blocks = approach
        ? [
              {
                  id: `${approach.id}-intuition`,
                  orderIndex: 1,
                  type: 'markdown' as const,
                  body: approach.code
                      ? `${approach.intuition}\n\n\`\`\`${approach.language || 'cpp'}\n${approach.code}\n\`\`\``
                      : approach.intuition
              }
          ]
        : [];

    return (
        <div className={styles.panel}>
            <div className={styles.tabs}>
                {sorted.map((item, index) => {
                    const locked = index >= unlocked;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={[
                                styles.tab,
                                !locked && index === active ? styles.tabActive : '',
                                locked ? styles.tabLocked : ''
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onClick={() => !locked && setActive(index)}
                            disabled={locked}
                            title={locked ? 'Read the previous approach first' : undefined}
                        >
                            {locked && <Lock size={12} />}
                            {KIND_LABELS[item.kind] ?? item.kind}
                        </button>
                    );
                })}
            </div>

            {isLocked ? (
                <div className={styles.gate}>
                    <p className={styles.gateText}>
                        Have a go first — even a brute-force attempt makes the optimal approach land
                        much harder. The walkthrough is not going anywhere.
                    </p>
                    <button
                        type="button"
                        className={styles.gateBtn}
                        onClick={() => setUnlocked(1)}
                    >
                        <Eye size={15} /> Show the {KIND_LABELS[sorted[0].kind]?.toLowerCase()} approach
                    </button>
                </div>
            ) : (
                <>
                    {(approach.timeComplexity || approach.spaceComplexity) && (
                        <div className={styles.complexity}>
                            {approach.timeComplexity && (
                                <span className={styles.chip}>
                                    <span className={styles.chipLabel}>Time</span>
                                    <span className={styles.chipValue}>{approach.timeComplexity}</span>
                                </span>
                            )}
                            {approach.spaceComplexity && (
                                <span className={styles.chip}>
                                    <span className={styles.chipLabel}>Space</span>
                                    <span className={styles.chipValue}>{approach.spaceComplexity}</span>
                                </span>
                            )}
                        </div>
                    )}

                    <ContentRenderer
                        blocks={blocks}
                        hideHeader
                        onOpenFullCompiler={onOpenFullCompiler}
                    />

                    {unlocked < sorted.length && (
                        <button
                            type="button"
                            className={styles.gateBtn}
                            style={{ alignSelf: 'flex-start' }}
                            onClick={() => {
                                setUnlocked(n => n + 1);
                                setActive(unlocked);
                            }}
                        >
                            <Eye size={15} /> Show the{' '}
                            {KIND_LABELS[sorted[unlocked].kind]?.toLowerCase()} approach
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default EditorialPanel;
