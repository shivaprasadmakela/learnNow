import React from 'react';
import { Collapsible } from '../../../../shared/components/ui/Collapsible';
import { ProblemRow } from '../ProblemRow';
import styles from './SectionAccordion.module.css';
import type { SectionNode } from '../StepAccordion/sectionTree';
import type { DsaProblemRow } from '../../api/dsa.api';

export interface SectionAccordionProps {
    node: SectionNode;
    /** Which section ids are open. Held by the sheet page so state survives a re-render. */
    openIds: Record<string, boolean>;
    onToggle: (sectionId: string) => void;
    onOpenProblem: (slug: string) => void;
    onToggleSolved: (problem: DsaProblemRow) => void;
    onToggleBookmark: (problem: DsaProblemRow) => void;
    canTrack?: boolean;
    isFilterActive?: boolean;
}

/**
 * One section and everything under it, to whatever depth the content goes.
 *
 * Replaces the rounded count badge with a full progress bar matching the step header,
 * and indents problems step-wise.
 */
export const SectionAccordion: React.FC<SectionAccordionProps> = ({
    node,
    openIds,
    onToggle,
    onOpenProblem,
    onToggleSolved,
    onToggleBookmark,
    canTrack,
    isFilterActive = false
}) => {
    const isOpen = isFilterActive ? true : Boolean(openIds[node.id]);

    const pct =
        node.totalProblems > 0
            ? Math.round((node.solvedProblems / node.totalProblems) * 100)
            : 0;
    const complete = node.totalProblems > 0 && node.solvedProblems >= node.totalProblems;

    return (
        <Collapsible
            isOpen={isOpen}
            onToggle={() => onToggle(node.id)}
            label={node.title ? `section ${node.title}` : 'this section'}
            className={styles.section}
            headerClassName={styles.header}
            bodyClassName={styles.body}
            style={{ ['--section-depth' as string]: node.depth }}
            header={
                <>
                    <div className={styles.titleGroup}>
                        <span className={styles.title}>{node.title ?? 'Problems'}</span>
                    </div>
                    <div className={styles.progress}>
                        <div className={styles.countGroup}>
                            <span className={styles.countNumber}>
                                {node.solvedProblems} / {node.totalProblems}
                            </span>
                            <span className={styles.countCaption}>Solved</span>
                        </div>
                        <div
                            className={styles.bar}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${node.title ?? 'Section'} progress`}
                        >
                            <div
                                className={`${styles.barFill} ${complete ? styles.barFillDone : ''}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                </>
            }
        >
            <div className={styles.problemWrapper} style={{ ['--section-depth' as string]: node.depth }}>
                {node.problems.map(problem => (
                    <ProblemRow
                        key={problem.id}
                        problem={problem}
                        onOpen={onOpenProblem}
                        onToggleSolved={onToggleSolved}
                        onToggleBookmark={onToggleBookmark}
                        canTrack={canTrack}
                    />
                ))}
            </div>

            {node.children.map(child => (
                <SectionAccordion
                    key={child.id}
                    node={child}
                    openIds={openIds}
                    onToggle={onToggle}
                    onOpenProblem={onOpenProblem}
                    onToggleSolved={onToggleSolved}
                    onToggleBookmark={onToggleBookmark}
                    canTrack={canTrack}
                    isFilterActive={isFilterActive}
                />
            ))}
        </Collapsible>
    );
};

export default SectionAccordion;
