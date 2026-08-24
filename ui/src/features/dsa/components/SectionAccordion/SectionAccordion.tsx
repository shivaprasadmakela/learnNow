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
 * Sections default to collapsed so the list opens level-by-level cleanly.
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
    const isOpen = Boolean(openIds[node.id]);

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
