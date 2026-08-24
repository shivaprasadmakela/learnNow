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
}

/**
 * One section and everything under it, to whatever depth the content goes.
 *
 * Recursive: a section renders its own problems, then renders itself again for each child. A fourth
 * or fifth grouping level needs no change here — it is simply one more turn of the recursion, which
 * is why the indentation is computed from `node.depth` rather than hardcoded per level.
 *
 * Sections default to open. Unlike a step, a section is a subdivision the reader has already chosen
 * to look inside, so collapsing it by default would make them click twice to reach anything.
 */
export const SectionAccordion: React.FC<SectionAccordionProps> = ({
    node,
    openIds,
    onToggle,
    onOpenProblem,
    onToggleSolved,
    onToggleBookmark,
    canTrack
}) => {
    const isOpen = openIds[node.id] !== false;

    return (
        <Collapsible
            isOpen={isOpen}
            onToggle={() => onToggle(node.id)}
            label={node.title ? `section ${node.title}` : 'this section'}
            className={styles.section}
            headerClassName={styles.header}
            bodyClassName={styles.body}
            // Each level steps in, so the hierarchy is legible without a connector line.
            style={{ ['--section-depth' as string]: node.depth }}
            header={
                <>
                    <span className={styles.title}>{node.title ?? 'Problems'}</span>
                    <span className={styles.count}>{node.totalProblems}</span>
                </>
            }
        >
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
                />
            ))}
        </Collapsible>
    );
};

export default SectionAccordion;
