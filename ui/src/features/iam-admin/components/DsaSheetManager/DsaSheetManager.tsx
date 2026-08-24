import React, { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle,
    Check,
    ChevronRight,
    Loader2,
    Play,
    Send,
    Trash2,
    Video
} from 'lucide-react';
import styles from './DsaSheetManager.module.css';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import {
    deleteDsaProblem,
    fetchAdminDsaSheets,
    generateExpectedOutputs,
    publishDsaProblem,
    publishDsaSheet,
    type AdminDsaProblemRow,
    type AdminDsaSheet
} from '../../../dsa/api/adminDsa.api';

export interface DsaSheetManagerProps {
    /** Bumped by the importer tab so this refreshes after content lands. */
    refreshToken?: number;
}

interface Feedback {
    tone: 'ok' | 'bad';
    text: string;
}

/**
 * What state each authored problem is in, and the two actions that move it forward.
 *
 * The generate-expected pass is the one worth surfacing prominently: a problem whose test cases have
 * no expected output will fail every submission with a wrong answer, and the only visible symptom is
 * learners reporting that a correct solution does not pass. So the count is shown per problem and
 * the button sits right beside it.
 */
export const DsaSheetManager: React.FC<DsaSheetManagerProps> = ({ refreshToken = 0 }) => {
    const [sheets, setSheets] = useState<AdminDsaSheet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
    const [busyId, setBusyId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminDsaProblemRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const runGenerate = async (problem: AdminDsaProblemRow) => {
        // Language is not asked for: cpp is what the reference solutions are written in, and a
        // problem with a different single harness is rare enough to fix in the JSON.
        setBusyId(problem.id);
        setFeedback(null);
        try {
            const result = await generateExpectedOutputs(problem.id, 'cpp');
            if (result.succeeded) {
                setFeedback({
                    tone: 'ok',
                    text: `${problem.slug}: wrote expected output for ${result.casesWritten} case${
                        result.casesWritten === 1 ? '' : 's'
                    }.`
                });
                await load();
            } else {
                setFeedback({
                    tone: 'bad',
                    text: `${problem.slug}: ${result.failureReason ?? 'the reference solution did not run'}`
                });
            }
        } catch (err) {
            setFeedback({
                tone: 'bad',
                text: err instanceof Error ? err.message : 'Could not generate expected output'
            });
        } finally {
            setBusyId(null);
        }
    };

    const runPublish = async (problem: AdminDsaProblemRow) => {
        setBusyId(problem.id);
        setFeedback(null);
        try {
            await publishDsaProblem(problem.id);
            setFeedback({ tone: 'ok', text: `${problem.slug} is now published.` });
            await load();
        } catch (err) {
            setFeedback({
                tone: 'bad',
                text: err instanceof Error ? err.message : 'Could not publish that'
            });
        } finally {
            setBusyId(null);
        }
    };

    const runPublishSheet = async (sheet: AdminDsaSheet) => {
        setBusyId(sheet.id);
        try {
            await publishDsaSheet(sheet.id);
            await load();
        } catch (err) {
            setFeedback({
                tone: 'bad',
                text: err instanceof Error ? err.message : 'Could not publish the sheet'
            });
        } finally {
            setBusyId(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteDsaProblem(deleteTarget.id);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            setFeedback({
                tone: 'bad',
                text: err instanceof Error ? err.message : 'Could not delete that problem'
            });
        } finally {
            setIsDeleting(false);
        }
    };

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
                            <span className={styles.stepMeta}>
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
                            const stepProblems = step.sections.flatMap(s => s.problems);
                            const isOpen = Boolean(openSteps[step.id]);
                            return (
                                <section key={step.id} className={styles.step}>
                                    <button
                                        type="button"
                                        className={styles.stepHead}
                                        onClick={() =>
                                            setOpenSteps(prev => ({
                                                ...prev,
                                                [step.id]: !prev[step.id]
                                            }))
                                        }
                                        aria-expanded={isOpen}
                                    >
                                        <ChevronRight
                                            size={16}
                                            style={{
                                                transform: isOpen ? 'rotate(90deg)' : 'none',
                                                color: 'var(--text-tertiary)'
                                            }}
                                        />
                                        <span className={styles.stepIndex}>
                                            Step {step.orderIndex}
                                        </span>
                                        <span className={styles.stepTitle}>{step.title}</span>
                                        <span className={styles.stepMeta}>
                                            {stepProblems.length} problems
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className={styles.table}>
                                            {step.sections.map(section => (
                                                <React.Fragment key={section.id}>
                                                    {section.title && (
                                                        <div className={styles.sectionLabel}>
                                                            {section.title}
                                                        </div>
                                                    )}
                                                    {section.problems.map(problem => (
                                                        <div key={problem.id} className={styles.row}>
                                                            <div className={styles.rowMain}>
                                                                <span className={styles.rowTitle}>
                                                                    {problem.title}
                                                                    <span
                                                                        className={`${styles.badge} ${
                                                                            problem.status ===
                                                                            'PUBLISHED'
                                                                                ? styles.badgePublished
                                                                                : styles.badgeDraft
                                                                        }`}
                                                                    >
                                                                        {problem.status}
                                                                    </span>
                                                                    <span className={styles.slug}>
                                                                        {problem.slug}
                                                                    </span>
                                                                </span>
                                                                <span className={styles.flags}>
                                                                    <span
                                                                        className={`${styles.flag} ${
                                                                            problem.harnessCount > 0
                                                                                ? styles.flagOk
                                                                                : styles.flagBad
                                                                        }`}
                                                                    >
                                                                        {problem.harnessCount} harness
                                                                        {problem.harnessCount === 1
                                                                            ? ''
                                                                            : 'es'}
                                                                    </span>
                                                                    <span
                                                                        className={`${styles.flag} ${
                                                                            problem.testCaseCount > 0
                                                                                ? styles.flagOk
                                                                                : styles.flagBad
                                                                        }`}
                                                                    >
                                                                        {problem.testCaseCount} case
                                                                        {problem.testCaseCount === 1
                                                                            ? ''
                                                                            : 's'}
                                                                    </span>
                                                                    {problem.missingExpectedCount >
                                                                        0 && (
                                                                        <span
                                                                            className={`${styles.flag} ${styles.flagWarn}`}
                                                                        >
                                                                            <AlertTriangle
                                                                                size={11}
                                                                            />
                                                                            {
                                                                                problem.missingExpectedCount
                                                                            }{' '}
                                                                            without expected output
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        className={`${styles.flag} ${
                                                                            problem.hasVideo
                                                                                ? styles.flagOk
                                                                                : ''
                                                                        }`}
                                                                    >
                                                                        <Video size={11} />
                                                                        {problem.hasVideo
                                                                            ? 'video'
                                                                            : 'no video'}
                                                                    </span>
                                                                </span>
                                                            </div>

                                                            <div className={styles.rowActions}>
                                                                <button
                                                                    type="button"
                                                                    className={styles.btn}
                                                                    onClick={() =>
                                                                        runGenerate(problem)
                                                                    }
                                                                    disabled={
                                                                        busyId === problem.id ||
                                                                        problem.harnessCount === 0 ||
                                                                        problem.testCaseCount === 0
                                                                    }
                                                                    title="Run the reference solution and store what it prints"
                                                                >
                                                                    {busyId === problem.id ? (
                                                                        <Loader2 size={13} />
                                                                    ) : (
                                                                        <Play size={13} />
                                                                    )}
                                                                    Generate expected
                                                                </button>
                                                                {problem.status !== 'PUBLISHED' && (
                                                                    <button
                                                                        type="button"
                                                                        className={styles.btn}
                                                                        onClick={() =>
                                                                            runPublish(problem)
                                                                        }
                                                                        disabled={
                                                                            busyId === problem.id
                                                                        }
                                                                    >
                                                                        <Check size={13} /> Publish
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className={styles.btn}
                                                                    onClick={() =>
                                                                        setDeleteTarget(problem)
                                                                    }
                                                                    disabled={busyId === problem.id}
                                                                    title="Deletes the problem and every learner's history of it"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </React.Fragment>
                );
            })}

            <ConfirmDeleteModal
                isOpen={Boolean(deleteTarget)}
                title={deleteTarget?.title || ''}
                isDeleting={isDeleting}
                onConfirm={confirmDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default DsaSheetManager;
