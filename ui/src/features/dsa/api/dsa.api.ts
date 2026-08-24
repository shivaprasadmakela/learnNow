import { apiFetch, apiFetchJson } from '../../../shared/api/client';
import {
    DEFAULT_PAGE_SIZE,
    toPageResponse,
    withPageParams,
    type PageResponse
} from '../../../shared/api/pagination';

/**
 * Every id here is a `string`. The backend issues UUIDs, and the course catalogue's
 * `TopicProgressSummary.id` is declared `number` against exactly that data — which is why code
 * elsewhere coerces real ids to `0`. Not repeating it.
 */

export type DsaDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type DsaProgressStatus = 'NOT_STARTED' | 'ATTEMPTED' | 'SOLVED';
export type DsaApproachKind = 'BRUTE' | 'BETTER' | 'OPTIMAL';

export type DsaVerdict =
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'COMPILE_ERROR'
    | 'RUNTIME_ERROR'
    | 'TIME_LIMIT'
    | 'ENGINE_ERROR'
    /** Client-side only: an ad-hoc case the learner invented has no expected answer to compare. */
    | 'EXECUTED';

export interface DsaStep {
    id: string;
    slug: string;
    orderIndex: number;
    title: string;
    description?: string;
    totalProblems: number;
    solvedProblems: number;
}

export interface DsaSheetDetail {
    id: string;
    slug: string;
    title: string;
    description?: string;
    playlistUrl?: string;
    totalProblems: number;
    solvedProblems: number;
    totalByDifficulty: Record<string, number>;
    solvedByDifficulty: Record<string, number>;
    steps: DsaStep[];
}

export interface DsaSectionRef {
    id: string;
    title?: string | null;
    depth: number;
}

export interface DsaProblemRow {
    id: string;
    slug: string;
    title: string;
    difficulty: DsaDifficulty;
    estimatedMinutes: number;
    tags: string[];
    hasVideo: boolean;
    practiceUrl?: string;
    practicePlatform?: string;
    /**
     * The problem's section ancestry, root first. The sheet rebuilds the tree from this, so a
     * fourth grouping level is one more entry here rather than a schema change on the client.
     */
    sectionPath: DsaSectionRef[];
    status: DsaProgressStatus;
    bookmarked: boolean;
}

export interface DsaSample {
    id: string;
    orderIndex: number;
    input: string;
    expectedOutput: string;
    explanation?: string;
}

export interface DsaHint {
    id: string;
    orderIndex: number;
    body: string;
}

export interface DsaApproach {
    id: string;
    kind: DsaApproachKind;
    orderIndex: number;
    intuition: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    language?: string;
    code?: string;
}

export interface DsaCheck {
    id: string;
    orderIndex: number;
    prompt: string;
    options: string[];
}

/** Only the stub half of a harness ever reaches the client. */
export interface DsaHarnessStub {
    language: string;
    starterCode: string;
}

export interface DsaProblemProgress {
    status: DsaProgressStatus;
    attemptCount: number;
    lastLanguage?: string;
}

export interface DsaProblemDetail {
    id: string;
    slug: string;
    title: string;
    statement: string;
    difficulty: DsaDifficulty;
    estimatedMinutes: number;
    tags: string[];
    youtubeUrl?: string;
    youtubePosition?: number;
    playlistUrl?: string;
    practiceUrl?: string;
    practicePlatform?: string;
    stepSlug: string;
    stepTitle: string;
    sectionTitle?: string;
    samples: DsaSample[];
    hints: DsaHint[];
    approaches: DsaApproach[];
    checks: DsaCheck[];
    harnesses: DsaHarnessStub[];
    /** False when the problem has no harness or no test cases — Run and Submit stay hidden. */
    judgeable: boolean;
    totalTestCases: number;
    progress: DsaProblemProgress;
    previousSlug?: string;
    nextSlug?: string;
}

export interface DsaCaseResult {
    caseNumber: number;
    sample: boolean;
    verdict: DsaVerdict;
    /** Null for a hidden case: it gives up its index and its verdict, nothing else. */
    input?: string | null;
    expectedOutput?: string | null;
    actualOutput?: string | null;
}

export interface DsaRunResult {
    verdict: DsaVerdict;
    passedCount: number;
    totalCount: number;
    firstFailedCase?: number | null;
    cases: DsaCaseResult[];
    compileOutput?: string | null;
    stderr?: string | null;
    stdout?: string | null;
    runtimeMs?: number | null;
    memoryKb?: number | null;
}

export interface DsaSubmitResult extends Omit<DsaRunResult, 'stdout'> {
    submissionId: string;
    /** False when re-submitting an already accepted solution — do not celebrate twice. */
    newlySolved: boolean;
    pointsAwarded: number;
}

export interface DsaSubmission {
    id: string;
    language: string;
    code: string;
    verdict: DsaVerdict;
    passedCount: number;
    totalCount: number;
    runtimeMs?: number | null;
    memoryKb?: number | null;
    createdAt: string;
}

export interface DsaCheckAnswer {
    correct: boolean;
    correctAnswer: string;
    explanation?: string;
    pointsAwarded: number;
}

export interface DsaSummary {
    sheetId: string;
    sheetSlug: string;
    sheetTitle: string;
    totalProblems: number;
    solvedProblems: number;
    totalByDifficulty: Record<string, number>;
    solvedByDifficulty: Record<string, number>;
    nextProblemSlug?: string;
    nextProblemTitle?: string;
    nextProblemStepSlug?: string;
}


/** The one sheet we ship. Kept here so a second sheet later is a parameter, not a rewrite. */
export const DEFAULT_SHEET_SLUG = 'learnnow-dsa-a2z';

export const fetchDsaSheet = (slug: string = DEFAULT_SHEET_SLUG): Promise<DsaSheetDetail> =>
    apiFetchJson<DsaSheetDetail>(`/api/dsa/sheets/${encodeURIComponent(slug)}`);

export const fetchDsaStepProblems = async (
    stepId: string,
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE
): Promise<PageResponse<DsaProblemRow>> => {
    const body = await apiFetchJson<PageResponse<DsaProblemRow> | DsaProblemRow[]>(
        withPageParams(`/api/dsa/steps/${stepId}/problems`, page, size)
    );
    return toPageResponse<DsaProblemRow>(body, size);
};

/** By id rather than slug, for the bookmark list which only stores the id. */
export const fetchDsaProblemById = (problemId: string): Promise<DsaProblemDetail> =>
    apiFetchJson<DsaProblemDetail>(`/api/dsa/problems/by-id/${problemId}`);

export const fetchDsaProblem = (slug: string): Promise<DsaProblemDetail> =>
    apiFetchJson<DsaProblemDetail>(`/api/dsa/problems/${encodeURIComponent(slug)}`);

export const runDsaProblem = (
    problemId: string,
    language: string,
    code: string,
    extraCases: string[] = []
): Promise<DsaRunResult> =>
    apiFetchJson<DsaRunResult>(`/api/dsa/problems/${problemId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, extraCases })
    });

export const submitDsaProblem = (
    problemId: string,
    language: string,
    code: string
): Promise<DsaSubmitResult> =>
    apiFetchJson<DsaSubmitResult>(`/api/dsa/problems/${problemId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
    });

export const answerDsaCheck = (checkId: string, selectedOption: string): Promise<DsaCheckAnswer> =>
    apiFetchJson<DsaCheckAnswer>(`/api/dsa/checks/${checkId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOption })
    });

export const setDsaProblemStatus = (
    problemId: string,
    status: DsaProgressStatus
): Promise<DsaProblemProgress> =>
    apiFetchJson<DsaProblemProgress>(`/api/me/dsa/problems/${problemId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });



export const fetchDsaSubmissions = async (
    problemId: string,
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE
): Promise<PageResponse<DsaSubmission>> => {
    const body = await apiFetchJson<PageResponse<DsaSubmission> | DsaSubmission[]>(
        withPageParams(`/api/me/dsa/problems/${problemId}/submissions`, page, size)
    );
    return toPageResponse<DsaSubmission>(body, size);
};


/**
 * The dashboard tile's data. Resolves to null when no sheet is published yet — the endpoint
 * answers 204 rather than inventing an empty sheet.
 */
export const fetchDsaSummary = async (): Promise<DsaSummary | null> => {
    const response = await apiFetch('/api/me/dsa/summary');
    if (response.status === 204) return null;
    if (!response.ok) throw new Error('Failed to fetch DSA summary');
    return response.json() as Promise<DsaSummary>;
};
