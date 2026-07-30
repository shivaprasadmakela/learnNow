import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileJson, Copy, Check, AlertCircle, Loader2, Edit3, FileUp, Sparkles, FolderPlus } from 'lucide-react';
import { importCourse, validateImportConflicts, fetchAdminPaths, type ImportResultDto, type AdminPathData, type ImportConflictItemDto, type ImportCoursePayload } from '../../api/admin.api';
import { ConflictResolutionModal, type ConflictStrategyOption } from './components/ConflictResolutionModal';
import type { CourseImporterProps } from './CourseImporter.types';
import styles from './CourseImporter.module.css';

const EXAMPLE_JSON_TEMPLATE = {
    title: "System Design & Distributed Systems",
    description: "Master scalable distributed systems, caching strategies, and event-driven architecture.",
    category: "Backend",
    managedBy: "learnNow",
    topics: [
        {
            title: "Scalability Principles",
            description: "Core concepts of horizontal scaling, load balancing, and high availability.",
            category: "course",
            duration: "2 hours",
            subtopics: [
                {
                    title: "Horizontal vs Vertical Scaling",
                    content: "Scalability defines how a system handles growing load.\n\n### Horizontal Scaling (Scale Out)\n- Adds more machines to the resource pool.\n- High availability with stateless application servers.\n\n### Vertical Scaling (Scale Up)\n- Adds more CPU and RAM to a single machine.\n- Has physical limits and single point of failure risk.",
                    questions: [
                        {
                            kind: "mcq",
                            prompt: "Which scaling approach adds more servers to a cluster?",
                            options: [
                                "Vertical Scaling",
                                "Horizontal Scaling",
                                "Database Sharding",
                                "In-Memory Caching"
                            ],
                            correctAnswer: "Horizontal Scaling",
                            explanation: "Horizontal scaling (scaling out) adds more machines to distribute workload.",
                            points: 5
                        }
                    ]
                },
                {
                    title: "CAP Theorem",
                    content: "The CAP Theorem states that a distributed system can only provide two of three guarantees simultaneously:\n- **Consistency**\n- **Availability**\n- **Partition Tolerance**",
                    questions: []
                }
            ]
        }
    ]
};

export const CourseImporter: React.FC<CourseImporterProps> = ({
    onImportSuccess,
    onCancel
}) => {
    const [jsonText, setJsonText] = useState<string>('');
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
    const [importResult, setImportResult] = useState<ImportResultDto | null>(null);
    const [pendingPayload, setPendingPayload] = useState<ImportCoursePayload | null>(null);
    const [detectedConflicts, setDetectedConflicts] = useState<ImportConflictItemDto[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importMode, setImportMode] = useState<'create' | 'append'>('create');
    const [availablePaths, setAvailablePaths] = useState<AdminPathData[]>([]);
    const [selectedPathId, setSelectedPathId] = useState<string>('');

    useEffect(() => {
        fetchAdminPaths().then(setAvailablePaths).catch(console.error);
    }, []);

    const handleCopyTemplate = () => {
        const formatted = JSON.stringify(EXAMPLE_JSON_TEMPLATE, null, 2);
        setJsonText(formatted);
        setErrorMessage(null);
        setCopiedTemplate(true);
        setTimeout(() => setCopiedTemplate(false), 2000);
    };

    const parseAndSetFile = (file: File) => {
        if (!file.name.endsWith('.json')) {
            setErrorMessage('Please upload a valid .json file');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setJsonText(text);
            setErrorMessage(null);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            parseAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            parseAndSetFile(e.target.files[0]);
        }
    };

    const executeImport = async (
        payload: ImportCoursePayload,
        strategy: 'FAIL_ON_CONFLICT' | ConflictStrategyOption = 'FAIL_ON_CONFLICT'
    ) => {
        try {
            setIsLoading(true);
            const fullPayload: ImportCoursePayload = { ...payload, conflictStrategy: strategy };
            const result = await importCourse(fullPayload);
            setImportResult(result);
            setDetectedConflicts([]);
            setPendingPayload(null);
            if (onImportSuccess) {
                onImportSuccess(result);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to import course';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        setErrorMessage(null);
        if (!jsonText.trim()) {
            setErrorMessage('Please paste or upload a JSON course payload first.');
            return;
        }
        if (importMode === 'append' && !selectedPathId) {
            setErrorMessage('Please select a destination course path for appending.');
            return;
        }

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(jsonText);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Invalid JSON format';
            setErrorMessage(`JSON Syntax Error: ${msg}`);
            return;
        }

        const payload: ImportCoursePayload = importMode === 'append'
            ? { pathId: selectedPathId, topics: (parsed.topics as unknown[]) ?? [] }
            : {
                title: parsed.title as string,
                description: parsed.description as string,
                category: parsed.category as string,
                managedBy: parsed.managedBy as string,
                topics: (parsed.topics as unknown[]) ?? []
            };

        try {
            setIsLoading(true);
            // Pre-check for conflicts via dry-run endpoint
            const validation = await validateImportConflicts(payload);
            if (validation.hasConflicts) {
                setPendingPayload(payload);
                setDetectedConflicts(validation.conflicts);
                setIsLoading(false);
                return;
            }
            await executeImport(payload, 'FAIL_ON_CONFLICT');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to validate course import';
            setErrorMessage(msg);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <div className={styles.headerIconBadge}>
                        <FileUp size={24} />
                    </div>
                    <div className={styles.titleArea}>
                        <div className={styles.titleRow}>
                            <h1>Bulk Course Importer</h1>
                            <span className={styles.schemaBadge}>
                                <span className={styles.badgeDot} />
                                JSON Schema v1.0
                            </span>
                        </div>
                        <p className={styles.subtitle}>
                            Import full multi-level course hierarchies (Path → Topics → Subtopics → MCQs) directly into Draft status for review and publishing.
                        </p>
                    </div>
                </div>

                <div className={styles.actionsGroup}>
                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={handleCopyTemplate}
                    >
                        {copiedTemplate ? <Check size={16} style={{ color: 'var(--tech-green)' }} /> : <Copy size={16} />}
                        <span>{copiedTemplate ? 'Template Loaded!' : 'Load Sample Template'}</span>
                    </button>
                </div>
            </header>

            {importResult ? (
                <div className={styles.successCard}>
                    <div className={styles.successHeader}>
                        <Check size={28} />
                        <span>
                            {importResult.mode === 'APPENDED' ? 'Topics Appended Successfully!' : 'Course Drafted Successfully!'}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        {importResult.mode === 'APPENDED'
                            ? <><strong>{importResult.topicsCreated} topic{importResult.topicsCreated !== 1 ? 's' : ''}</strong> appended to <strong>&ldquo;{importResult.pathTitle}&rdquo;</strong> in Draft status. Review and publish when ready.</>  
                            : <>Path <strong>&ldquo;{importResult.pathTitle}&rdquo;</strong> created with status <strong>{importResult.status}</strong>. Review and publish when ready.</>
                        }
                    </p>

                    <div className={styles.statsGrid}>
                        <div className={styles.statPill}>
                            <span className={styles.statLabel}>{importResult.mode === 'APPENDED' ? 'Topics Appended' : 'Topics Created'}</span>
                            <span className={styles.statValue}>{importResult.topicsCreated}</span>
                        </div>
                        <div className={styles.statPill}>
                            <span className={styles.statLabel}>Subtopics</span>
                            <span className={styles.statValue}>{importResult.subtopicsCreated}</span>
                        </div>
                        <div className={styles.statPill}>
                            <span className={styles.statLabel}>MCQs</span>
                            <span className={styles.statValue}>{importResult.questionsCreated}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        {onImportSuccess && (
                            <button
                                type="button"
                                className={styles.submitBtn}
                                onClick={() => onImportSuccess(importResult)}
                            >
                                <Edit3 size={16} />
                                Open in Configuration Editor
                            </button>
                        )}
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => {
                                setImportResult(null);
                                setJsonText('');
                            }}
                        >
                            {importResult.mode === 'APPENDED' ? 'Append More Topics' : 'Import Another Course'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Import Mode Selector */}
                    <div className={styles.modeSelector}>
                        <button
                            type="button"
                            className={`${styles.modeCard} ${importMode === 'create' ? styles.modeCardActive : ''}`}
                            onClick={() => setImportMode('create')}
                        >
                            <div className={styles.modeCardIcon}><Sparkles size={18} /></div>
                            <div>
                                <p className={styles.modeCardTitle}>Create New Learning Path</p>
                                <p className={styles.modeCardDesc}>Import JSON to create a brand new course from scratch in Draft status.</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            className={`${styles.modeCard} ${importMode === 'append' ? styles.modeCardActive : ''}`}
                            onClick={() => setImportMode('append')}
                        >
                            <div className={styles.modeCardIcon}><FolderPlus size={18} /></div>
                            <div>
                                <p className={styles.modeCardTitle}>Append to Existing Course</p>
                                <p className={styles.modeCardDesc}>Add new topics to an already existing course path without touching existing content.</p>
                            </div>
                        </button>
                    </div>

                    {/* Destination Path selector (append mode only) */}
                    {importMode === 'append' && (
                        <div className={styles.pathSelectRow}>
                            <span className={styles.pathSelectLabel}>
                                <FolderPlus size={14} /> Destination Course Path
                            </span>
                            <select
                                className={styles.pathSelect}
                                value={selectedPathId}
                                onChange={(e) => { setSelectedPathId(e.target.value); setErrorMessage(null); }}
                            >
                                <option value="">— Select a course to append topics to —</option>
                                {availablePaths.map(p => (
                                    <option key={p.id} value={p.id!}>
                                        {p.title} ({p.topics?.length ?? 0} topics · {p.status})
                                    </option>
                                ))}
                            </select>
                            <p className={styles.appendHint}>
                                ✦ Only the <code>topics</code> array is read from your JSON in append mode. Top-level <code>title</code> / <code>description</code> fields are ignored.
                            </p>
                        </div>
                    )}

                    {/* Drag and Drop Zone */}
                    <div
                        className={`${styles.uploadDropzone} ${isDragging ? styles.uploadDropzoneDragging : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                        <div className={styles.dropzoneIcon}>
                            <FileJson size={24} />
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Drag and drop your course .json file here
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                            or click to browse your computer
                        </div>
                    </div>

                    {/* JSON Textarea Editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            JSON Payload Body:
                        </label>
                        <textarea
                            className={styles.jsonInputBox}
                            value={jsonText}
                            onChange={(e) => {
                                setJsonText(e.target.value);
                                if (errorMessage) setErrorMessage(null);
                            }}
                            placeholder="Paste your JSON course data here or click 'Load Sample Template' above..."
                        />
                    </div>

                    {errorMessage && (
                        <div className={styles.errorBanner}>
                            <AlertCircle size={18} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        {onCancel && (
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={isLoading || !jsonText.trim() || (importMode === 'append' && !selectedPathId)}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>{importMode === 'append' ? 'Appending Topics...' : 'Importing Draft Course...'}</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    <span>{importMode === 'append' ? 'Append Topics to Course' : 'Import Course to Draft'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {detectedConflicts.length > 0 && pendingPayload && (
                <ConflictResolutionModal
                    conflicts={detectedConflicts}
                    isLoading={isLoading}
                    onConfirm={(strategy) => executeImport(pendingPayload, strategy)}
                    onCancel={() => {
                        setDetectedConflicts([]);
                        setPendingPayload(null);
                    }}
                />
            )}
        </div>
    );
};
