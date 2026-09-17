import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Eye, Loader2, Save } from 'lucide-react';
import styles from './DsaProblemEditorModal.module.css';
import { Modal } from '../../../../shared/components/ui/Modal';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import { Input, Select, Textarea } from '../../../../shared/components/ui/Input';
import { MonacoEditorPane } from '../../../../shared/components/editor';
import { DsaProblemPage } from '../../../dsa';
import { ListEditor } from './ListEditor';
import {
    toDraft,
    toPayload,
    validate,
    type ApproachDraft,
    type CheckDraft,
    type HarnessDraft,
    type HintDraft,
    type ProblemDraft,
    type TestCaseDraft
} from './problemDraft';
import {
    fetchAdminDsaProblem,
    updateDsaProblem
} from '../../../dsa/api/adminDsa.api';
import { monacoLanguageFor } from '../../../dsa/utils/dsaExecutionHelper';

export interface DsaProblemEditorModalProps {
    /** Null keeps the dialog closed. Changing it loads that problem. */
    problemId: string | null;
    onClose: () => void;
    /** Called after a successful save, so the sheet behind refreshes its flags. */
    onSaved: () => void;
}

type EditorTab = 'preview' | 'details' | 'hints' | 'editorial' | 'tests' | 'harness';

const DIFFICULTIES = [
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' }
];

const APPROACH_KINDS = [
    { value: 'BRUTE', label: 'Brute force' },
    { value: 'BETTER', label: 'Better' },
    { value: 'OPTIMAL', label: 'Optimal' }
];

/**
 * Preview and edit one problem, in the dialog the sheet opens.
 *
 * The Preview tab is the learner workspace itself — the same `DsaProblemPage` the sheet routes to,
 * pointed at the authoring endpoint so it can render a draft. That is the whole reason this exists
 * as a dialog rather than a form page: an author can read the statement as written, check the
 * examples line up, and actually run the reference solution through the real judge before
 * publishing, without leaving the tree they are working through.
 *
 * The preview shows what is *saved*. Rendering unsaved edits would mean reimplementing the whole
 * learner view against the draft, which is the duplication this was built to avoid — so the tab
 * says so, and remounts after every save.
 */
export const DsaProblemEditorModal: React.FC<DsaProblemEditorModalProps> = ({
    problemId,
    onClose,
    onSaved
}) => {
    const [draft, setDraft] = useState<ProblemDraft | null>(null);
    const [baseline, setBaseline] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<EditorTab>('preview');
    /** Bumped on save so the preview refetches instead of showing the pre-save problem. */
    const [previewVersion, setPreviewVersion] = useState(0);
    const [harnessIndex, setHarnessIndex] = useState(0);

    useEffect(() => {
        if (!problemId) {
            setDraft(null);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        setTab('preview');
        setHarnessIndex(0);
        fetchAdminDsaProblem(problemId)
            .then(problem => {
                if (cancelled) return;
                const next = toDraft(problem);
                setDraft(next);
                setBaseline(JSON.stringify(next));
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Could not load that problem');
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [problemId]);

    const patch = useCallback((changes: Partial<ProblemDraft>) => {
        setDraft(prev => (prev ? { ...prev, ...changes } : prev));
    }, []);

    /**
     * Dirt is a deep comparison against what was loaded, not a flag set by every handler.
     *
     * A flag drifts: type into a field and undo it, and the dialog still claims unsaved changes
     * and still blocks a backdrop click. The draft is small enough that stringifying it is free.
     */
    const isDirty = useMemo(
        () => Boolean(draft) && JSON.stringify(draft) !== baseline,
        [draft, baseline]
    );

    const validationErrors = useMemo(() => (draft ? validate(draft) : []), [draft]);

    const save = async () => {
        if (!problemId || !draft || validationErrors.length > 0) return;
        setIsSaving(true);
        setError(null);
        try {
            // Reseeded from the response, not from what was sent: the server normalises languages,
            // renumbers order indexes and may keep an expected output the form left blank.
            const stored = await updateDsaProblem(problemId, toPayload(draft));
            const next = toDraft(stored);
            setDraft(next);
            setBaseline(JSON.stringify(next));
            setPreviewVersion(n => n + 1);
            onSaved();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save that problem');
        } finally {
            setIsSaving(false);
        }
    };

    const activeHarness: HarnessDraft | undefined = draft?.harnesses[harnessIndex];

    const updateHarness = (changes: Partial<HarnessDraft>) => {
        setDraft(prev =>
            prev
                ? {
                      ...prev,
                      harnesses: prev.harnesses.map((harness, index) =>
                          index === harnessIndex ? { ...harness, ...changes } : harness
                      )
                  }
                : prev
        );
    };

    return (
        <Modal
            isOpen={Boolean(problemId)}
            onClose={onClose}
            size="full"
            title={draft ? draft.title : 'Problem'}
            subtitle={draft ? `${draft.slug} · ${draft.status}` : undefined}
            // A stray backdrop click must not throw away unsaved edits.
            closeOnBackdrop={!isDirty}
            bodyClassName={styles.body}
            headerExtra={
                <div className={styles.headerActions}>
                    {isDirty && <span className={styles.dirty}>Unsaved changes</span>}
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={save}
                        disabled={!isDirty || isSaving || validationErrors.length > 0}
                        title={
                            validationErrors.length > 0
                                ? 'Fix the problems listed below first'
                                : 'Save every tab'
                        }
                    >
                        {isSaving ? (
                            <Loader2 size={14} className={styles.spin} />
                        ) : (
                            <Save size={14} />
                        )}
                        Save
                    </button>
                </div>
            }
        >
            <Tabs
                items={[
                    { id: 'preview', label: 'Preview', icon: <Eye size={14} /> },
                    { id: 'details', label: 'Details' },
                    { id: 'hints', label: 'Hints', count: draft?.hints.length },
                    { id: 'editorial', label: 'Editorial', count: draft?.approaches.length },
                    { id: 'tests', label: 'Test cases', count: draft?.testCases.length },
                    { id: 'harness', label: 'Harness', count: draft?.harnesses.length }
                ]}
                activeId={tab}
                onChange={id => setTab(id as EditorTab)}
                variant="compact"
                label="Problem editor"
                className={styles.tabs}
            />

            {(error || validationErrors.length > 0) && (
                <div className={styles.issues}>
                    <AlertTriangle size={14} />
                    <ul>
                        {error && <li>{error}</li>}
                        {validationErrors.map(message => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {isLoading && <p className={styles.state}>Loading the problem...</p>}

            {draft && !isLoading && (
                <div className={styles.pane}>
                    {tab === 'preview' && problemId && (
                        <div className={styles.previewPane}>
                            <p className={styles.previewNote}>
                                This is the learner workspace, showing what is saved. Run and Submit
                                reach the real judge, so a reference solution can be checked here
                                before publishing. Save to see edits from the other tabs.
                            </p>
                            <div className={styles.previewHost}>
                                <DsaProblemPage
                                    key={`${problemId}-${previewVersion}`}
                                    previewProblemId={problemId}
                                    isLoggedIn
                                />
                            </div>
                        </div>
                    )}

                    {tab === 'details' && (
                        <div className={styles.form}>
                            <div className={styles.grid}>
                                <Input
                                    label="Title"
                                    value={draft.title}
                                    onChange={e => patch({ title: e.target.value })}
                                />
                                <Input
                                    label="Slug"
                                    value={draft.slug}
                                    readOnly
                                    hint="Fixed. The learner URL, every bookmark and the import file all key on it."
                                />
                                <Select
                                    label="Difficulty"
                                    options={DIFFICULTIES}
                                    value={draft.difficulty}
                                    onChange={e =>
                                        patch({
                                            difficulty: e.target
                                                .value as ProblemDraft['difficulty']
                                        })
                                    }
                                />
                                <Select
                                    label="Status"
                                    options={[
                                        { value: 'DRAFT', label: 'Draft' },
                                        { value: 'PUBLISHED', label: 'Published' }
                                    ]}
                                    value={draft.status}
                                    onChange={e =>
                                        patch({ status: e.target.value as ProblemDraft['status'] })
                                    }
                                />
                                <Input
                                    label="Estimated minutes"
                                    type="number"
                                    min={1}
                                    value={draft.estimatedMinutes}
                                    onChange={e =>
                                        patch({
                                            estimatedMinutes: Math.max(
                                                1,
                                                Number(e.target.value) || 1
                                            )
                                        })
                                    }
                                />
                                <Input
                                    label="Tags"
                                    value={draft.tagsText}
                                    onChange={e => patch({ tagsText: e.target.value })}
                                    hint="Comma separated."
                                />
                                <Input
                                    label="YouTube URL"
                                    value={draft.youtubeUrl}
                                    onChange={e => patch({ youtubeUrl: e.target.value })}
                                    hint="Shown as the walkthrough on the Editorial tab."
                                />
                                <Input
                                    label="Position in the playlist"
                                    value={draft.youtubePosition}
                                    onChange={e => patch({ youtubePosition: e.target.value })}
                                />
                                <Input
                                    label="Practice URL"
                                    value={draft.practiceUrl}
                                    onChange={e => patch({ practiceUrl: e.target.value })}
                                />
                                <Input
                                    label="Practice platform"
                                    value={draft.practicePlatform}
                                    onChange={e => patch({ practicePlatform: e.target.value })}
                                />
                            </div>

                            <Textarea
                                label="Statement"
                                rows={18}
                                value={draft.statement}
                                onChange={e => patch({ statement: e.target.value })}
                                hint="Markdown, through the same renderer as lesson content — fenced code, tables and diagrams all work. Leave the worked examples out: they render from the sample test cases, so they cannot drift from what actually runs."
                            />

                            <div>
                                <h3 className={styles.sectionHead}>Inline question</h3>
                                <p className={styles.sectionNote}>
                                    The "now your turn" question inside the statement. The answer is
                                    compared on the server and never sent to the page, so it cannot
                                    be read out of the DOM.
                                </p>
                                <ListEditor<CheckDraft>
                                    items={draft.checks}
                                    onChange={checks => patch({ checks })}
                                    blank={() => ({
                                        prompt: '',
                                        optionsText: '',
                                        correctAnswer: '',
                                        explanation: '',
                                        points: 2
                                    })}
                                    itemLabel={index => `Question ${index + 1}`}
                                    addLabel="Add a question"
                                    emptyText="No inline question on this problem."
                                    renderItem={(check, _index, update) => (
                                        <>
                                            <Textarea
                                                label="Prompt"
                                                rows={2}
                                                value={check.prompt}
                                                onChange={e => update({ prompt: e.target.value })}
                                            />
                                            <Textarea
                                                label="Options"
                                                rows={4}
                                                value={check.optionsText}
                                                onChange={e =>
                                                    update({ optionsText: e.target.value })
                                                }
                                                hint="One per line."
                                            />
                                            <div className={styles.grid}>
                                                <Input
                                                    label="Correct answer"
                                                    value={check.correctAnswer}
                                                    onChange={e =>
                                                        update({ correctAnswer: e.target.value })
                                                    }
                                                    hint="Must match one of the options exactly."
                                                />
                                                <Input
                                                    label="Points"
                                                    type="number"
                                                    min={0}
                                                    value={check.points}
                                                    onChange={e =>
                                                        update({
                                                            points: Number(e.target.value) || 0
                                                        })
                                                    }
                                                />
                                            </div>
                                            <Textarea
                                                label="Explanation"
                                                rows={2}
                                                value={check.explanation}
                                                onChange={e =>
                                                    update({ explanation: e.target.value })
                                                }
                                                hint="Shown after answering, right or wrong."
                                            />
                                        </>
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {tab === 'hints' && (
                        <div className={styles.form}>
                            <p className={styles.sectionNote}>
                                Revealed one at a time, in this order — a learner has to open hint
                                one before hint two exists. So order them from a nudge towards the
                                idea to a statement of the approach, not from easiest to type.
                            </p>
                            <ListEditor<HintDraft>
                                items={draft.hints}
                                onChange={hints => patch({ hints })}
                                blank={() => ({ body: '' })}
                                itemLabel={index => `Hint ${index + 1}`}
                                addLabel="Add a hint"
                                emptyText="No hints yet."
                                renderItem={(hint, _index, update) => (
                                    <Textarea
                                        label="Hint"
                                        rows={3}
                                        value={hint.body}
                                        onChange={e => update({ body: e.target.value })}
                                    />
                                )}
                            />
                        </div>
                    )}

                    {tab === 'editorial' && (
                        <div className={styles.form}>
                            <p className={styles.sectionNote}>
                                Approaches unlock in order too: a learner reads brute force before
                                optimal is clickable. The intuition is rendered as markdown, and the
                                code block below it is appended to that, so it is fenced
                                automatically.
                            </p>
                            <ListEditor<ApproachDraft>
                                items={draft.approaches}
                                onChange={approaches => patch({ approaches })}
                                blank={() => ({
                                    kind: 'BRUTE',
                                    intuition: '',
                                    timeComplexity: '',
                                    spaceComplexity: '',
                                    language: 'cpp',
                                    code: ''
                                })}
                                itemLabel={index => `Approach ${index + 1}`}
                                addLabel="Add an approach"
                                emptyText="No write-up yet."
                                renderItem={(approach, _index, update) => (
                                    <>
                                        <div className={styles.grid}>
                                            <Select
                                                label="Kind"
                                                options={APPROACH_KINDS}
                                                value={approach.kind}
                                                onChange={e =>
                                                    update({
                                                        kind: e.target
                                                            .value as ApproachDraft['kind']
                                                    })
                                                }
                                            />
                                            <Input
                                                label="Time complexity"
                                                value={approach.timeComplexity}
                                                onChange={e =>
                                                    update({ timeComplexity: e.target.value })
                                                }
                                            />
                                            <Input
                                                label="Space complexity"
                                                value={approach.spaceComplexity}
                                                onChange={e =>
                                                    update({ spaceComplexity: e.target.value })
                                                }
                                            />
                                            <Input
                                                label="Code language"
                                                value={approach.language}
                                                onChange={e =>
                                                    update({ language: e.target.value })
                                                }
                                                hint="Used for syntax highlighting."
                                            />
                                        </div>
                                        <Textarea
                                            label="Intuition"
                                            rows={6}
                                            value={approach.intuition}
                                            onChange={e => update({ intuition: e.target.value })}
                                        />
                                        <Textarea
                                            label="Code"
                                            mono
                                            rows={10}
                                            value={approach.code}
                                            onChange={e => update({ code: e.target.value })}
                                        />
                                    </>
                                )}
                            />
                        </div>
                    )}

                    {tab === 'tests' && (
                        <div className={styles.form}>
                            <p className={styles.sectionNote}>
                                Sample cases are public: they render as the Examples in the
                                statement and are the only ones Run executes. Everything else is
                                hidden and only Submit touches it. Changing a case's input clears
                                its expected output, because the stored answer belonged to the old
                                input — run Generate expected again after.
                            </p>
                            <ListEditor<TestCaseDraft>
                                items={draft.testCases}
                                onChange={testCases => patch({ testCases })}
                                blank={() => ({
                                    input: '',
                                    expectedOutput: '',
                                    sample: false,
                                    explanation: ''
                                })}
                                itemLabel={index => `Case ${index + 1}`}
                                addLabel="Add a test case"
                                emptyText="No test cases — this problem cannot be judged."
                                renderItem={(testCase, _index, update) => (
                                    <>
                                        <label className={styles.checkRow}>
                                            <input
                                                type="checkbox"
                                                checked={testCase.sample}
                                                onChange={e =>
                                                    update({ sample: e.target.checked })
                                                }
                                            />
                                            Sample — visible to learners as a worked example
                                        </label>
                                        <Textarea
                                            label="Input"
                                            mono
                                            rows={4}
                                            value={testCase.input}
                                            onChange={e => update({ input: e.target.value })}
                                        />
                                        <Textarea
                                            label="Expected output"
                                            mono
                                            rows={3}
                                            value={testCase.expectedOutput}
                                            onChange={e =>
                                                update({ expectedOutput: e.target.value })
                                            }
                                            hint="Leave blank and let Generate expected fill it from the reference solution."
                                        />
                                        <Textarea
                                            label="Explanation"
                                            rows={2}
                                            value={testCase.explanation}
                                            onChange={e =>
                                                update({ explanation: e.target.value })
                                            }
                                            hint="Shown under the example. Samples only."
                                        />
                                    </>
                                )}
                            />
                        </div>
                    )}

                    {tab === 'harness' && (
                        <div className={styles.form}>
                            {draft.harnesses.length === 0 ? (
                                <p className={styles.empty}>
                                    No harness, so this problem cannot be judged in any language.
                                    Harnesses are written in the import JSON — the driver is
                                    intricate enough that authoring it here would mostly be a way
                                    to break it.
                                </p>
                            ) : (
                                <>
                                    <Tabs
                                        items={draft.harnesses.map((harness, index) => ({
                                            id: String(index),
                                            label: harness.language
                                        }))}
                                        activeId={String(harnessIndex)}
                                        onChange={id => setHarnessIndex(Number(id))}
                                        variant="pill"
                                        label="Harness language"
                                    />

                                    {activeHarness && (
                                        <>
                                            <p className={styles.sectionNote}>
                                                The driver must contain{' '}
                                                <code>{'{{USER_CODE}}'}</code>, which is where the
                                                learner's submission is spliced in. Without it the
                                                problem compiles and judges nothing.
                                            </p>

                                            <div className={styles.codeField}>
                                                <span className={styles.codeLabel}>
                                                    Starter code — what the editor opens with
                                                </span>
                                                <div className={styles.codeHost}>
                                                    <MonacoEditorPane
                                                        code={activeHarness.starterCode}
                                                        language={monacoLanguageFor(
                                                            activeHarness.language
                                                        )}
                                                        onChange={value =>
                                                            updateHarness({ starterCode: value })
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.codeField}>
                                                <span className={styles.codeLabel}>
                                                    Driver code — reads the input and prints the
                                                    answer
                                                </span>
                                                <div className={styles.codeHost}>
                                                    <MonacoEditorPane
                                                        code={activeHarness.driverCode}
                                                        language={monacoLanguageFor(
                                                            activeHarness.language
                                                        )}
                                                        onChange={value =>
                                                            updateHarness({ driverCode: value })
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.codeField}>
                                                <span className={styles.codeLabel}>
                                                    Reference solution — what Generate expected runs
                                                </span>
                                                <div className={styles.codeHost}>
                                                    <MonacoEditorPane
                                                        code={activeHarness.referenceSolution}
                                                        language={monacoLanguageFor(
                                                            activeHarness.language
                                                        )}
                                                        onChange={value =>
                                                            updateHarness({
                                                                referenceSolution: value
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default DsaProblemEditorModal;
