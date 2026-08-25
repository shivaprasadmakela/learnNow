import React, { useMemo } from 'react';
import { Collapsible } from '../../../../shared/components/ui/Collapsible';
import styles from './StepAccordion.module.css';
import { ProblemRow } from '../ProblemRow';
import { SectionAccordion } from '../SectionAccordion';
import { buildSectionTree, shouldShowSections } from './sectionTree';
import { InfiniteScrollSentinel } from '../../../../shared/components/ui/InfiniteScrollSentinel';
import type { DsaProblemRow, DsaStep } from '../../api/dsa.api';

export interface StepAccordionProps {
    step: DsaStep;
    isOpen: boolean;
    onToggle: () => void;
    problems: DsaProblemRow[];
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    onOpenProblem: (slug: string) => void;
    onToggleSolved: (problem: DsaProblemRow) => void;
    onToggleBookmark: (problem: DsaProblemRow) => void;
    /** Which sections are collapsed. Lifted so it survives the step closing and reopening. */
    openSectionIds: Record<string, boolean>;
    onToggleSection: (sectionId: string) => void;
    canTrack?: boolean;
    isFilterActive?: boolean;
}

export const StepAccordion: React.FC<StepAccordionProps> = ({
    step,
    isOpen,
    onToggle,
    problems,
    hasMore,
    isLoading,
    onLoadMore,
    onOpenProblem,
    onToggleSolved,
    onToggleBookmark,
    openSectionIds,
    onToggleSection,
    canTrack = true,
    isFilterActive = false
}) => {
    const pct =
        step.totalProblems > 0
            ? Math.round((step.solvedProblems / step.totalProblems) * 100)
            : 0;
    const complete = step.totalProblems > 0 && step.solvedProblems >= step.totalProblems;

    /** The section tree, derived from each problem's ancestry. See sectionTree.ts. */
    const sections = useMemo(() => buildSectionTree(problems), [problems]);
    const showSections = shouldShowSections(sections);

    return (
        <Collapsible
            isOpen={isOpen}
            onToggle={onToggle}
            label={`step ${step.orderIndex}, ${step.title}`}
            className={styles.step}
            bodyClassName={styles.body}
            header={
                <>
                    <div className={styles.titleGroup}>
                        <span className={styles.index}>Step {step.orderIndex}</span>
                        <span className={styles.title}>{step.title}</span>
                        {step.description && (
                            <span className={styles.description}>{step.description}</span>
                        )}
                    </div>
                    <div className={styles.progress}>
                        <div className={styles.countGroup}>
                            <span className={styles.countNumber}>
                                {step.solvedProblems} / {step.totalProblems}
                            </span>
                            <span className={styles.countCaption}>Solved</span>
                        </div>
                        <div
                            className={styles.bar}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${step.title} progress`}
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
            {showSections
                ? sections.map(section => (
                      <SectionAccordion
                          key={section.id}
                          node={section}
                          openIds={openSectionIds}
                          onToggle={onToggleSection}
                          onOpenProblem={onOpenProblem}
                          onToggleSolved={onToggleSolved}
                          onToggleBookmark={onToggleBookmark}
                          canTrack={canTrack}
                          isFilterActive={isFilterActive}
                      />
                  ))
                : problems.map(problem => (
                      <ProblemRow
                          key={problem.id}
                          problem={problem}
                          onOpen={onOpenProblem}
                          onToggleSolved={onToggleSolved}
                          onToggleBookmark={onToggleBookmark}
                          canTrack={canTrack}
                      />
                  ))}

            {problems.length === 0 && !isLoading && !hasMore && (
                <p className={styles.empty}>
                    {isFilterActive
                        ? 'No problems match the current filters in this step.'
                        : 'Nothing published in this step yet — it is being written.'}
                </p>
            )}

            <InfiniteScrollSentinel
                hasMore={hasMore}
                isLoading={isLoading}
                onLoadMore={onLoadMore}
                loadingText="Loading problems..."
                loadMoreLabel="Load more problems"
            />
        </Collapsible>
    );
};

export default StepAccordion;
