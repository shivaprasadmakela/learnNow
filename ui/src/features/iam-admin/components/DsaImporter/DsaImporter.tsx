import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileJson, FileUp, Loader2, Search, Upload } from 'lucide-react';
import styles from './DsaImporter.module.css';
import {
    importDsaContent,
    validateDsaImport,
    type DsaImportResult
} from '../../../dsa/api/adminDsa.api';

export interface DsaImporterProps {
    /** Lets the sheet manager tab refresh once content lands. */
    onImported?: (result: DsaImportResult) => void;
}

interface Counts {
    steps: number;
    problems: number;
    harnesses: number;
    testCases: number;
    missingExpected: number;
}

/** Counts what the pasted payload contains, before the server sees it. */
const countPayload = (raw: string): Counts | null => {
    try {
        const parsed = JSON.parse(raw);
        const steps = Array.isArray(parsed?.steps) ? parsed.steps : [];
        let problems = 0;
        let harnesses = 0;
        let testCases = 0;
        let missingExpected = 0;

        for (const step of steps) {
            for (const section of step?.sections ?? []) {
                for (const problem of section?.problems ?? []) {
                    problems += 1;
                    harnesses += Object.keys(problem?.harnesses ?? {}).length;
                    const cases = problem?.testCases ?? [];
                    testCases += cases.length;
                    missingExpected += cases.filter(
                        (c: { expectedOutput?: string }) =>
                            !c?.expectedOutput || !String(c.expectedOutput).trim()
                    ).length;
                }
            }
        }
        return { steps: steps.length, problems, harnesses, testCases, missingExpected };
    } catch {
        return null;
    }
};

export const DsaImporter: React.FC<DsaImporterProps> = ({ onImported }) => {
    const [jsonText, setJsonText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'validating' | 'importing'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [dryRun, setDryRun] = useState<DsaImportResult | null>(null);
    const [result, setResult] = useState<DsaImportResult | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const counts = useMemo(() => (jsonText.trim() ? countPayload(jsonText) : null), [jsonText]);

    const readFile = (file: File) => {
        if (!file.name.endsWith('.json')) {
            setError('That is not a .json file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            setJsonText((e.target?.result as string) ?? '');
            setError(null);
            setDryRun(null);
            setResult(null);
        };
        reader.readAsText(file);
    };

    const parse = (): unknown | null => {
        try {
            return JSON.parse(jsonText);
        } catch (err) {
            setError(
                `That is not valid JSON — ${err instanceof Error ? err.message : 'could not parse it'}`
            );
            return null;
        }
    };

    const runValidate = async () => {
        setError(null);
        setResult(null);
        const payload = parse();
        if (!payload) return;

        setPhase('validating');
        try {
            setDryRun(await validateDsaImport(payload));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The dry run failed');
            setDryRun(null);
        } finally {
            setPhase('idle');
        }
    };

    const runImport = async () => {
        setError(null);
        const payload = parse();
        if (!payload) return;

        setPhase('importing');
        try {
            const imported = await importDsaContent(payload);
            setResult(imported);
            setDryRun(null);
            onImported?.(imported);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The import failed');
        } finally {
            setPhase('idle');
        }
    };

    const busy = phase !== 'idle';
    const summary = result ?? dryRun;

    return (
        <div className={styles.wrap}>
            <p className={styles.intro}>
                Paste or drop one step&apos;s JSON. Matching is by slug all the way down, so
                re-importing the same file updates the problems in place — every learner keeps their
                progress, notes and submissions. Nothing is ever deleted by an import: a problem you
                remove from the file is left alone rather than taken away along with somebody&apos;s
                history.
            </p>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                >
                    <FileUp size={15} /> Choose a file
                </button>
                <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={runValidate}
                    disabled={busy || !jsonText.trim()}
                >
                    {phase === 'validating' ? (
                        <Loader2 size={15} className="spin" />
                    ) : (
                        <Search size={15} />
                    )}
                    Dry run
                </button>
                <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={runImport}
                    disabled={busy || !jsonText.trim()}
                >
                    {phase === 'importing' ? (
                        <Loader2 size={15} className="spin" />
                    ) : (
                        <Upload size={15} />
                    )}
                    Import
                </button>
                {jsonText && (
                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => {
                            setJsonText('');
                            setError(null);
                            setDryRun(null);
                            setResult(null);
                        }}
                        disabled={busy}
                    >
                        Clear
                    </button>
                )}
            </div>

            <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className={styles.hiddenInput}
                onChange={e => e.target.files?.[0] && readFile(e.target.files[0])}
            />

            {!jsonText && (
                <div
                    className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files?.[0]) readFile(e.dataTransfer.files[0]);
                    }}
                >
                    <FileJson size={26} color="var(--tech-blue)" />
                    Drop a step JSON here, or click to choose one
                </div>
            )}

            <textarea
                className={styles.textarea}
                value={jsonText}
                onChange={e => {
                    setJsonText(e.target.value);
                    setError(null);
                    setDryRun(null);
                    setResult(null);
                }}
                placeholder={'{\n  "sheetSlug": "learnnow-dsa-a2z",\n  "steps": [ ... ]\n}'}
                spellCheck={false}
                aria-label="Step JSON"
            />

            {counts && (
                <div className={styles.counts}>
                    <span>
                        Steps <span className={styles.countValue}>{counts.steps}</span>
                    </span>
                    <span>
                        Problems <span className={styles.countValue}>{counts.problems}</span>
                    </span>
                    <span>
                        Harnesses <span className={styles.countValue}>{counts.harnesses}</span>
                    </span>
                    <span>
                        Test cases <span className={styles.countValue}>{counts.testCases}</span>
                    </span>
                    {counts.missingExpected > 0 && (
                        <span>
                            Missing expected output{' '}
                            <span className={styles.countValue}>{counts.missingExpected}</span>
                        </span>
                    )}
                </div>
            )}

            {jsonText.trim() && !counts && (
                <div className={`${styles.banner} ${styles.bannerError}`}>
                    <span className={styles.bannerTitle}>Not parseable yet</span>
                    Still being typed, or malformed. The dry run will say exactly where.
                </div>
            )}

            {error && (
                <div className={`${styles.banner} ${styles.bannerError}`}>
                    <span className={styles.bannerTitle}>
                        <AlertCircle size={12} /> Failed
                    </span>
                    <pre className={styles.pre}>{error}</pre>
                </div>
            )}

            {summary && (
                <div className={`${styles.banner} ${result ? styles.bannerOk : ''}`}>
                    <span className={styles.bannerTitle}>
                        {result ? (
                            <>
                                <CheckCircle2 size={12} /> Imported into {summary.sheetSlug}
                            </>
                        ) : (
                            <>Dry run — nothing was written</>
                        )}
                    </span>

                    <div className={styles.stats} style={{ marginTop: '10px' }}>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>Steps created</span>
                            <span className={styles.statValue}>{summary.stepsCreated}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>Steps updated</span>
                            <span className={styles.statValue}>{summary.stepsUpdated}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>Problems created</span>
                            <span className={styles.statValue}>{summary.problemsCreated}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>Problems updated</span>
                            <span className={styles.statValue}>{summary.problemsUpdated}</span>
                        </div>
                        {result && (
                            <>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Harnesses</span>
                                    <span className={styles.statValue}>
                                        {summary.harnessesWritten}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Test cases</span>
                                    <span className={styles.statValue}>
                                        {summary.testCasesWritten}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {summary.warnings.length > 0 && (
                        <>
                            <p style={{ margin: '12px 0 0', fontSize: '0.8rem' }}>
                                {summary.warnings.length} thing
                                {summary.warnings.length === 1 ? '' : 's'} worth knowing:
                            </p>
                            <ul className={styles.warnList}>
                                {summary.warnings.map(warning => (
                                    <li key={warning}>{warning}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DsaImporter;
