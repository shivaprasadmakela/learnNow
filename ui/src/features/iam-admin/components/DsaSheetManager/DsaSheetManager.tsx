import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Check,
    Loader2,
    Pencil,
    Play,
    Send,
    Trash2,
    Video
} from 'lucide-react';
import styles from './DsaSheetManager.module.css';
import { Collapsible } from '../../../../shared/components/ui/Collapsible';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { DsaProblemEditorModal } from '../DsaProblemEditorModal';
import { InlineTitleEditor } from './InlineTitleEditor';
import { buildAdminSectionTree, type AdminSectionNode } from './adminSectionTree';
import {
    deleteDsaProblem,
    deleteDsaSection,
    deleteDsaStep,
    fetchAdminDsaSheets,
    generateExpectedOutputs,
    publishDsaProblem,
    publishDsaSheet,
    updateDsaSection,
    updateDsaStep,
    type AdminDsaProblemRow,
    type AdminDsaSheet,
    type AdminDsaStep
} from '../../../dsa/api/adminDsa.api';

export interface DsaSheetManagerProps {
    /** Bumped by the importer tab so this refreshes after content lands. */
    refreshToken?: number;
}

interface Feedback {
    tone: 'ok' | 'bad';
    text: string;
}

/** What a confirmation dialog is about to remove, and what goes with it. */
interface DeleteTarget {
    kind: 'problem' | 'section' | 'step';
    id: string;
    title: string;
    description: string;
}

/* ------------------------------------------------------------------ problem row */

interface ProblemRowProps {
    problem: AdminDsaProblemRow;
    busyId: string | null;
    onOpen: (problem: AdminDsaProblemRow) => void;
    onGenerate: (problem: AdminDsaProblemRow) => void;
    onPublish: (problem: AdminDsaProblemRow) => void;
    onDelete: (problem: AdminDsaProblemRow) => void;
}

/**
 * One authored problem.
 *
 * The flags are the point of this row. A problem with no harness, no cases, or cases without
 * expected output looks perfectly fine on the sheet and then fails every correct submission, and
 * the only symptom is learners saying so. Surfacing all three here, beside the button that fixes
 * the last one, is what keeps that from shipping.
 */
const ProblemRow: React.FC<ProblemRowProps> = ({
    problem,
    busyId,
    onOpen,
    onGenerate,
    onPublish,
    onDelete
}) => {
    const isBusy = busyId === problem.id;

    return (
        <div className={styles.row}>
            <div className={styles.rowMain}>
                <span className={styles.rowTitle}>
                    <button
                        type="button"
                        className={styles.rowTitleBtn}
                        onClick={() => onOpen(problem)}
                        title="Preview and edit this problem"
                    >
                        {problem.title}
                    </button>
                    <span
                        className={`${styles.badge} ${
                            problem.status === 'PUBLISHED' ? styles.badgePublished : styles.badgeDraft
                        }`}
                    >
                        {problem.status}
                    </span>
                    <span className={styles.slug}>{problem.slug}</span>
                </span>
                <span className={styles.flags}>
                    <span
                        className={`${styles.flag} ${
                            problem.harnessCount > 0 ? styles.flagOk : styles.flagBad
                        }`}
                    >
                        {problem.harnessCount} harness{problem.harnessCount === 1 ? '' : 'es'}
                    </span>
                    <span
                        className={`${styles.flag} ${
                            problem.testCaseCount > 0 ? styles.flagOk : styles.flagBad
                        }`}
                    >
                        {problem.testCaseCount} case{problem.testCaseCount === 1 ? '' : 's'}
                    </span>
                    {problem.missingExpectedCount > 0 && (
                        <span className={`${styles.flag} ${styles.flagWarn}`}>
                            <AlertTriangle size={11} />
                            {problem.missingExpectedCount} without expected output
                        </span>
                    )}
                    <span className={`${styles.flag} ${problem.hasVideo ? styles.flagOk : ''}`}>
                        <Video size={11} />
                        {problem.hasVideo ? 'video' : 'no video'}
                    </span>
                </span>
            </div>

            <div className={styles.rowActions}>
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => onOpen(problem)}
                    title="Open the learner workspace for this problem, and edit it"
                >
                    <Pencil size={13} /> Preview &amp; edit
                </button>
                <button
                    type="button"
                    className={styles.btn}
                    onClick={() => onGenerate(problem)}
                    disabled={isBusy || problem.harnessCount === 0 || problem.testCaseCount === 0}
                    title="Run the reference solution and store what it prints"
                >
                    {isBusy ? <Loader2 size={13} className={styles.spin} /> : <Play size={13} />}
                    Generate expected
                </button>
                {problem.status !== 'PUBLISHED' && (
                    <button
                        type="button"
                        className={styles.btn}
                        onClick={() => onPublish(problem)}
                        disabled={isBusy}
                    >
                        <Check size={13} /> Publish
                    </button>
                )}
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={() => onDelete(problem)}
                    disabled={isBusy}
                    title="Deletes the problem and every learner's history of it"
                    aria-label={`Delete ${problem.title}`}
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ section branch */

interface SectionBranchProps {
    node: AdminSectionNode;
    closedIds: Record<string, boolean>;
    onToggle: (id: string) => void;
    onRename: (sectionId: string, title: string | null) => Promise<void>;
    onDeleteSection: (node: AdminSectionNode) => void;
    rowProps: Omit<ProblemRowProps, 'problem'>;
}

/**
 * One section and everything under it, to whatever depth the content goes.
 *
 * Recursive rather than depth-capped, and built on the same `Collapsible` the learner sheet uses,
 * so a fourth or fifth grouping level needs nothing here.
 */
const SectionBranch: React.FC<SectionBranchProps> = ({
    node,
    closedIds,
    onToggle,
    onRename,
    onDeleteSection,
    rowProps
}) => (
    <Collapsible
        isOpen={!closedIds[node.id]}
        onToggle={() => onToggle(node.id)}
        label={node.title ? `section ${node.title}` : 'this section'}
        className={styles.section}
        headerClassName={styles.sectionHeader}
        bodyClassName={styles.sectionBody}
        style={{ ['--section-depth' as string]: node.depth }}
        header={
            <>
                <InlineTitleEditor
                    value={node.title}
                    placeholder="Untitled section"
                    allowEmpty
                    onSave={title => onRename(node.id, title)}
                    titleClassName={styles.sectionTitle}
                />
                <span className={styles.nodeMeta}>
                    {node.totalProblems} problem{node.totalProblems === 1 ? '' : 's'}
                    {node.draftProblems > 0 ? ` · ${node.draftProblems} draft` : ''}
                    {node.incompleteProblems > 0
                        ? ` · ${node.incompleteProblems} incomplete`
                        : ''}
                </span>
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={() => onDeleteSection(node)}
                    title="Deletes this section, its sub-sections and every problem in them"
                    aria-label={`Delete section ${node.title ?? 'untitled'}`}
                >
                    <Trash2 size={13} />
                </button>
            </>
        }
    >
        {node.problems.length === 0 && node.children.length === 0 && (
            <p className={styles.emptyNode}>Nothing in this section yet.</p>
        )}

        {node.problems.map(problem => (
            <ProblemRow key={problem.id} problem={problem} {...rowProps} />
        ))}

        {node.children.map(child => (
            <SectionBranch
                key={child.id}
                node={child}
                closedIds={closedIds}
                onToggle={onToggle}
                onRename={onRename}
                onDeleteSection={onDeleteSection}
                rowProps={rowProps}
            />
        ))}
    </Collapsible>
);

/* ------------------------------------------------------------------ manager */

export const DsaSheetManager: React.FC<DsaSheetManagerProps> = ({ refreshToken = 0 }) => {
    const [sheets, setSheets] = useState<AdminDsaSheet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
    /**
     * Only the sections the author has explicitly closed. Absent means open.
     *
     * Stored as exceptions rather than as the full set because sections arrive expanded: opening a
     * step and finding its sections shut too means two clicks to reach anything, and the tree
     * exists to be scanned. Keeping it this way also means a reload cannot reset what was closed,
     * and there is no effect racing the data to seed defaults.
     */
    const [closedSections, setClosedSections] = useState<Record<string, boolean>>({});
    const [busyId, setBusyId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editing, setEditing] = useState<AdminDsaProblemRow | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await fetchAdminDsaSheets(0, 25);
            setSheets(result.content);
        } catch (err) {
            setFeedback({
                tone: 'bad',
                text: err instanceof Error ? err.message : 'Could not load the sheets'
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load, refreshToken]);

    const sectionTreesByStep = useMemo(() => {
        const trees: Record<string, AdminSectionNode[]> = {};
        for (const sheet of sheets) {
            for (const step of sheet.steps) {
                trees[step.id] = buildAdminSectionTree(step.sections);
            }
        }
        return trees;
    }, [sheets]);

    const toggleSection = useCallback((id: string) => {
        setClosedSections(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    /** Wraps an action in the busy flag, the error banner and a reload. */
    const runAction = useCallback(
        async (id: string, whenItFails: string, action: () => Promise<string | null>) => {
            setBusyId(id);
            setFeedback(null);
            try {
                const message = await action();
                if (message) setFeedback({ tone: 'ok', text: message });
                await load();
            } catch (err) {
                setFeedback({
                    tone: 'bad',
                    text: err instanceof Error ? err.message : whenItFails
                });
            } finally {
                setBusyId(null);
            }
        },
        [load]
    );

    const runGenerate = useCallback(
        (problem: AdminDsaProblemRow) =>
            // Language is not asked for: cpp is what the reference solutions are written in, and a
            // problem with a different single harness is rare enough to fix in the JSON.
            runAction(problem.id, 'Could not generate expected output', async () => {
                const result = await generateExpectedOutputs(problem.id, 'cpp');
                if (!result.succeeded) {
                    throw new Error(
                        `${problem.slug}: ${
                            result.failureReason ?? 'the reference solution did not run'
                        }`
                    );
                }
                return `${problem.slug}: wrote expected output for ${result.casesWritten} case${
                    result.casesWritten === 1 ? '' : 's'
                }.`;
            }),
        [runAction]
    );

    const runPublish = useCallback(
        (problem: AdminDsaProblemRow) =>
            runAction(problem.id, 'Could not publish that', async () => {
                await publishDsaProblem(problem.id);
                return `${problem.slug} is now published.`;
            }),
        [runAction]
    );

    const runPublishSheet = useCallback(
        (sheet: AdminDsaSheet) =>
            runAction(sheet.id, 'Could not publish the sheet', async () => {
                await publishDsaSheet(sheet.id);
                return `${sheet.slug} is now published.`;
            }),
        [runAction]
    );

    const renameStep = useCallback(
        async (step: AdminDsaStep, title: string | null) => {
            await runAction(step.id, 'Could not rename that step', async () => {
                await updateDsaStep(step.id, { title: title ?? step.title });
                return null;
            });
        },
        [runAction]
    );

    const renameSection = useCallback(
        async (sectionId: string, title: string | null) => {
            await runAction(sectionId, 'Could not rename that section', async () => {
                await updateDsaSection(sectionId, { title });
                return null;
            });
        },
        [runAction]
    );

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            if (deleteTarget.kind === 'problem') await deleteDsaProblem(deleteTarget.id);
            if (deleteTarget.kind === 'section') await deleteDsaSection(deleteTarget.id);
            if (deleteTarget.kind === 'step') await deleteDsaStep(deleteTarget.id);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            setFeedback({
                tone: 'bad',
                text: err instanceof Error ? err.message : 'Could not delete that'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const rowProps = useMemo(
        () => ({
            busyId,
            onOpen: setEditing,
            onGenerate: runGenerate,
            onPublish: runPublish,
            onDelete: (problem: AdminDsaProblemRow) =>
                setDeleteTarget({
                    kind: 'problem',
                    id: problem.id,
                    title: problem.title,
                    description:
                        " This cannot be undone. It also removes every learner's submissions and" +
                        ' progress on this problem.'
                })
        }),
        [busyId, runGenerate, runPublish]
    );

    if (isLoading) {
        return <p className={styles.state}>Loading authored sheets...</p>;
    }

    if (sheets.length === 0) {
        return (
            <p className={styles.state}>
                Nothing imported yet. Use the Import JSON tab and this will fill in.
            </p>
        );
    }

    return (
        <div className={styles.wrap}>
            {feedback && (
                <div
                    className={`${styles.banner} ${
                        feedback.tone === 'ok' ? styles.bannerOk : styles.bannerBad
                    }`}
                >
                    <pre className={styles.pre}>{feedback.text}</pre>
                </div>
            )}

            {sheets.map(sheet => {
                const problems = sheet.steps.flatMap(s => s.sections.flatMap(sec => sec.problems));
                const drafts = problems.filter(p => p.status === 'DRAFT').length;
                const missing = problems.filter(p => p.missingExpectedCount > 0).length;

                return (
                    <React.Fragment key={sheet.id}>
                        <div className={styles.sheetHead}>
                            <span className={styles.sheetTitle}>{sheet.title}</span>
                            <span
                                className={`${styles.badge} ${
                                    sheet.status === 'PUBLISHED'
                                        ? styles.badgePublished
                                        : styles.badgeDraft
                                }`}
                            >
                                {sheet.status}
                            </span>
                            <span className={styles.slug}>{sheet.slug}</span>
                            <div className={styles.spacer} />
                            <span className={styles.nodeMeta}>
                                {problems.length} problems · {drafts} draft
                                {missing > 0 ? ` · ${missing} missing expected output` : ''}
                            </span>
                            {sheet.status !== 'PUBLISHED' && (
                                <button
                                    type="button"
                                    className={styles.btn}
                                    onClick={() => runPublishSheet(sheet)}
                                    disabled={busyId === sheet.id}
                                >
                                    <Send size={13} /> Publish sheet
                                </button>
                            )}
                        </div>

                        {sheet.steps.map(step => {
                            const tree = sectionTreesByStep[step.id] ?? [];
                            const stepProblems = step.sections.flatMap(s => s.problems);

                            return (
                                <Collapsible
                                    key={step.id}
                                    isOpen={Boolean(openSteps[step.id])}
                                    onToggle={() =>
                                        setOpenSteps(prev => ({
                                            ...prev,
                                            [step.id]: !prev[step.id]
                                        }))
                                    }
                                    label={`step ${step.orderIndex}, ${step.title}`}
                                    className={styles.step}
                                    headerClassName={styles.stepHeader}
                                    bodyClassName={styles.stepBody}
                                    header={
                                        <>
                                            <span className={styles.stepIndex}>
                                                Step {step.orderIndex}
                                            </span>
                                            <InlineTitleEditor
                                                value={step.title}
                                                placeholder="Step title"
                                                onSave={title => renameStep(step, title)}
                                                titleClassName={styles.stepTitle}
                                            />
                                            <span className={styles.nodeMeta}>
                                                {stepProblems.length} problem
                                                {stepProblems.length === 1 ? '' : 's'}
                                            </span>
                                            <button
                                                type="button"
                                                className={`${styles.btn} ${styles.btnDanger}`}
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        kind: 'step',
                                                        id: step.id,
                                                        title: step.title,
                                                        description: ` This cannot be undone. It removes ${stepProblems.length} problem${
                                                            stepProblems.length === 1 ? '' : 's'
                                                        } and every learner's progress on them.`
                                                    })
                                                }
                                                title="Deletes the step and everything under it"
                                                aria-label={`Delete step ${step.title}`}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </>
                                    }
                                >
                                    {tree.length === 0 ? (
                                        <p className={styles.emptyNode}>
                                            No sections in this step yet.
                                        </p>
                                    ) : (
                                        tree.map(node => (
                                            <SectionBranch
                                                key={node.id}
                                                node={node}
                                                closedIds={closedSections}
                                                onToggle={toggleSection}
                                                onRename={renameSection}
                                                onDeleteSection={section =>
                                                    setDeleteTarget({
                                                        kind: 'section',
                                                        id: section.id,
                                                        title: section.title ?? 'Untitled section',
                                                        description: ` This cannot be undone. It removes its sub-sections, ${section.totalProblems} problem${
                                                            section.totalProblems === 1 ? '' : 's'
                                                        } and every learner's progress on them.`
                                                    })
                                                }
                                                rowProps={rowProps}
                                            />
                                        ))
                                    )}
                                </Collapsible>
                            );
                        })}
                    </React.Fragment>
                );
            })}

            <ConfirmDeleteModal
                isOpen={Boolean(deleteTarget)}
                title={deleteTarget?.title || ''}
                entityLabel={deleteTarget?.kind ?? 'item'}
                description={deleteTarget?.description}
                isDeleting={isDeleting}
                onConfirm={confirmDelete}
                onClose={() => setDeleteTarget(null)}
            />

            <DsaProblemEditorModal
                problemId={editing?.id ?? null}
                onClose={() => setEditing(null)}
                onSaved={load}
            />
        </div>
    );
};

export default DsaSheetManager;
