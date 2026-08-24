import { apiFetch, apiFetchJson } from '../../../shared/api/client';
import {
    DEFAULT_PAGE_SIZE,
    toPageResponse,
    withPageParams,
    type PageResponse
} from '../../../shared/api/pagination';

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
    orderIndex: number;
    title?: string;
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
    harnesses: AdminDsaHarness[];
    testCases: AdminDsaTestCase[];
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
