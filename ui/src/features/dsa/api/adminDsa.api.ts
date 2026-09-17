import { apiFetch, apiFetchJson } from '../../../shared/api/client';
import {
    DEFAULT_PAGE_SIZE,
    toPageResponse,
    withPageParams,
    type PageResponse
} from '../../../shared/api/pagination';
import type { DsaProblemDetail } from './dsa.api';

/**
 * Admin-side DSA calls.
 *
 * Kept in a separate module from `dsa.api.ts` for the same reason the backend keeps separate DTOs:
 * these responses carry driver code, reference solutions and hidden expected output. Nothing here
 * should ever be imported by a learner-facing component, and a separate file makes that visible in
 * the import list rather than buried in a type.
 */

export interface AdminDsaProblemRow {
    id: string;
    slug: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    status: 'DRAFT' | 'PUBLISHED';
    orderIndex: number;
    hasVideo: boolean;
    harnessCount: number;
    testCaseCount: number;
    /** Cases still waiting on the generate-expected-output pass. */
    missingExpectedCount: number;
}

export interface AdminDsaSection {
    id: string;
    /** Null at the top level. The manager rebuilds the tree from this. */
    parentSectionId?: string | null;
    orderIndex: number;
    depth: number;
    title?: string;
    description?: string;
    problems: AdminDsaProblemRow[];
}

export interface AdminDsaStep {
    id: string;
    slug: string;
    orderIndex: number;
    title: string;
    description?: string;
    sections: AdminDsaSection[];
}

export interface AdminDsaSheet {
    id: string;
    slug: string;
    title: string;
    description?: string;
    playlistUrl?: string;
    status: 'DRAFT' | 'PUBLISHED';
    steps: AdminDsaStep[];
}

export interface AdminDsaHarness {
    id: string;
    language: string;
    starterCode: string;
    driverCode: string;
    referenceSolution?: string;
}

export interface AdminDsaTestCase {
    id: string;
    orderIndex: number;
    input: string;
    expectedOutput: string;
    sample: boolean;
    explanation?: string;
}

export interface AdminDsaCheck {
    id: string;
    orderIndex: number;
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    points: number;
}

export interface AdminDsaApproach {
    id: string;
    kind: 'BRUTE' | 'BETTER' | 'OPTIMAL';
    orderIndex: number;
    intuition: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    language?: string;
    code?: string;
}

export interface AdminDsaHint {
    id: string;
    orderIndex: number;
    body: string;
}

export interface AdminDsaProblem {
    id: string;
    slug: string;
    title: string;
    statement: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    tags: string[];
    estimatedMinutes: number;
    youtubeUrl?: string;
    youtubePosition?: number;
    practiceUrl?: string;
    practicePlatform?: string;
    status: 'DRAFT' | 'PUBLISHED';
    sectionId: string;
    orderIndex: number;
    approaches: AdminDsaApproach[];
    hints: AdminDsaHint[];
    harnesses: AdminDsaHarness[];
    testCases: AdminDsaTestCase[];
    checks: AdminDsaCheck[];
}

/**
 * What the authoring modal sends back.
 *
 * Every collection is optional, and that is deliberate rather than laziness: omitting one leaves
 * the stored rows alone, while sending an empty array clears them. Without that distinction a tab
 * the author never opened would wipe the rows it never loaded.
 */
export interface DsaProblemUpdate {
    title: string;
    statement: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    tags?: string[];
    estimatedMinutes?: number;
    youtubeUrl?: string | null;
    youtubePosition?: number | null;
    practiceUrl?: string | null;
    practicePlatform?: string | null;
    status?: 'DRAFT' | 'PUBLISHED';
    hints?: string[];
    approaches?: Array<{
        kind: string;
        intuition: string;
        timeComplexity?: string | null;
        spaceComplexity?: string | null;
        language?: string | null;
        code?: string | null;
    }>;
    testCases?: Array<{
        input: string;
        expectedOutput?: string;
        sample: boolean;
        explanation?: string | null;
    }>;
    checks?: Array<{
        prompt: string;
        options: string[];
        correctAnswer: string;
        explanation?: string | null;
        points?: number;
    }>;
    harnesses?: Array<{
        language: string;
        starterCode: string;
        driverCode: string;
        referenceSolution?: string | null;
    }>;
}

export interface DsaImportResult {
    sheetId?: string | null;
    sheetSlug: string;
    stepsCreated: number;
    stepsUpdated: number;
    problemsCreated: number;
    problemsUpdated: number;
    harnessesWritten: number;
    testCasesWritten: number;
    warnings: string[];
}

export interface DsaExpectedOutputResult {
    language: string;
    casesWritten: number;
    succeeded: boolean;
    failureReason?: string | null;
    generatedOutputs: string[];
}

export const fetchAdminDsaSheets = async (
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE
): Promise<PageResponse<AdminDsaSheet>> => {
    const body = await apiFetchJson<PageResponse<AdminDsaSheet> | AdminDsaSheet[]>(
        withPageParams('/api/admin/dsa/sheets', page, size)
    );
    return toPageResponse<AdminDsaSheet>(body, size);
};

export const fetchAdminDsaSheet = (sheetId: string): Promise<AdminDsaSheet> =>
    apiFetchJson<AdminDsaSheet>(`/api/admin/dsa/sheets/${sheetId}`);

export const fetchAdminDsaProblem = (problemId: string): Promise<AdminDsaProblem> =>
    apiFetchJson<AdminDsaProblem>(`/api/admin/dsa/problems/${problemId}`);

/** Dry run. Reports what an import would create and update, and writes nothing. */
export const validateDsaImport = (payload: unknown): Promise<DsaImportResult> =>
    apiFetchJson<DsaImportResult>('/api/admin/dsa/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

export const importDsaContent = (payload: unknown): Promise<DsaImportResult> =>
    apiFetchJson<DsaImportResult>('/api/admin/dsa/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

/**
 * Runs the reference solution over every test case and stores what it printed.
 *
 * The alternative is hand-computing the answer to several hundred cases, so in practice this is the
 * step that makes a sheet this size authorable at all.
 */
export const generateExpectedOutputs = (
    problemId: string,
    language: string
): Promise<DsaExpectedOutputResult> =>
    apiFetchJson<DsaExpectedOutputResult>(
        `/api/admin/dsa/problems/${problemId}/expected/${language}`,
        { method: 'POST' }
    );

export const publishDsaProblem = async (problemId: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/dsa/problems/${problemId}/publish`, { method: 'POST' });
    if (!res.ok) throw new Error('Could not publish that problem');
};

export const publishDsaSheet = async (sheetId: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/dsa/sheets/${sheetId}/publish`, { method: 'POST' });
    if (!res.ok) throw new Error('Could not publish that sheet');
};

export const deleteDsaProblem = async (problemId: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/dsa/problems/${problemId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Could not delete that problem');
};

/**
 * Rewrites one problem.
 *
 * Returns the stored result rather than nothing, so the modal reseeds from what the server
 * actually kept — the generate-expected pass, the order indexes and the harness normalisation all
 * happen server-side, and a form left holding what it sent drifts from the row it is editing.
 */
export const updateDsaProblem = (
    problemId: string,
    payload: DsaProblemUpdate
): Promise<AdminDsaProblem> =>
    apiFetchJson<AdminDsaProblem>(`/api/admin/dsa/problems/${problemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

export const updateDsaSection = async (
    sectionId: string,
    payload: { title?: string | null; description?: string | null }
): Promise<void> => {
    const res = await apiFetch(`/api/admin/dsa/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Could not rename that section');
};

/** Deletes the section, its sub-sections and every problem in them. */
export const deleteDsaSection = async (sectionId: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/dsa/sections/${sectionId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Could not delete that section');
};

export const updateDsaStep = async (
    stepId: string,
    payload: { title: string; description?: string | null }
): Promise<void> => {
    const res = await apiFetch(`/api/admin/dsa/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Could not rename that step');
};

/** Deletes the step and everything under it. */
export const deleteDsaStep = async (stepId: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/dsa/steps/${stepId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Could not delete that step');
};

/**
 * One problem in the shape learners receive it, whether or not it is published.
 *
 * This is what lets the authoring preview render the real workspace instead of a second rendering
 * built from admin DTOs — a preview that goes through different code is a preview of something
 * other than what ships. It returns `DsaProblemDetail`, the learner type, so driver code and
 * hidden expected output have no field to arrive in even here.
 */
export const fetchDsaProblemPreview = (problemId: string): Promise<DsaProblemDetail> =>
    apiFetchJson<DsaProblemDetail>(`/api/admin/dsa/problems/${problemId}/preview`);
