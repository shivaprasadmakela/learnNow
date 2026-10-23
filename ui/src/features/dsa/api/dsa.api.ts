import { apiFetch, apiFetchJson } from '../../../shared/api/client';
import { cachedResource, progressChanged } from '../../../shared/api/cache';
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
    /** Lets a page of the sheet-wide search, which spans steps, be filed under each step. */
    stepId: string;
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

/** One language's code for an approach. `language` is a compiler id: `java`, `cpp`, `python`... */
export interface DsaSolution {
    language: string;
    code: string;
}

/**
 * What the problem page knows about an approach before the editorial is opened: its kind and its
 * cost. The reasoning and the code arrive with `fetchDsaEditorial`, when the learner asks.
 */
export interface DsaApproachSummary {
    id: string;
    kind: DsaApproachKind;
    orderIndex: number;
    timeComplexity?: string;
    spaceComplexity?: string;
}

export interface DsaApproach {
    id: string;
    kind: DsaApproachKind;
    orderIndex: number;
    intuition: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    /** One entry per language the approach is written in. Empty for a prose-only approach. */
    solutions: DsaSolution[];
}

export interface DsaEditorial {
    problemId: string;
    approaches: DsaApproach[];
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
    /** How many hints there are. Each one is fetched with `fetchDsaHint` when it is revealed. */
    hintCount: number;
    /** The editorial's outline only; `fetchDsaEditorial` has the reasoning and the code. */
    approaches: DsaApproachSummary[];
    checks: DsaCheck[];
    harnesses: DsaHarnessStub[];
    /** False when the problem has no harness or no test cases — Run and Submit stay hidden. */
    judgeable: boolean;
    totalTestCases: number;
    progress: DsaProblemProgress;
    /** False for an anonymous reader. */
    bookmarked: boolean;
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
    /** Only the first answer can score; this one was graded for feedback and earned nothing. */
    alreadyAttempted: boolean;
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

/** The sheet page's search box and filters. `ALL`, or leaving a field out, matches everything. */
export interface DsaSheetSearch {
    q?: string;
    difficulty?: 'ALL' | DsaDifficulty;
    status?: 'ALL' | 'TODO' | 'SOLVED' | 'BOOKMARKED';
}

/**
 * One page of the whole sheet's problems matching a search, in sheet order.
 *
 * One request covers every step. The page used to open all eighteen steps to search them, and
 * then searched only the first page of each.
 */
export const searchDsaSheetProblems = async (
    search: DsaSheetSearch,
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE,
    slug: string = DEFAULT_SHEET_SLUG
): Promise<PageResponse<DsaProblemRow>> => {
    const params = new URLSearchParams();
    if (search.q?.trim()) params.set('q', search.q.trim());
    if (search.difficulty && search.difficulty !== 'ALL') params.set('difficulty', search.difficulty);
    if (search.status && search.status !== 'ALL') params.set('status', search.status);
    const query = params.toString();
    const body = await apiFetchJson<PageResponse<DsaProblemRow> | DsaProblemRow[]>(
        withPageParams(
            `/api/dsa/sheets/${encodeURIComponent(slug)}/problems${query ? `?${query}` : ''}`,
            page,
            size
        )
    );
    return toPageResponse<DsaProblemRow>(body, size);
};

/** By id rather than slug, for the bookmark list which only stores the id. */
export const fetchDsaProblemById = (problemId: string): Promise<DsaProblemDetail> =>
    apiFetchJson<DsaProblemDetail>(`/api/dsa/problems/by-id/${problemId}`);

export const fetchDsaProblem = (slug: string): Promise<DsaProblemDetail> =>
    apiFetchJson<DsaProblemDetail>(`/api/dsa/problems/${encodeURIComponent(slug)}`);

/*
 * Hints and the editorial are fetched when the learner asks for them, then kept for the session:
 * they are content rather than per-learner state, so coming back to a problem - or reloading it
 * after a submit - shows them again without another request. The promise is what is kept, so two
 * quick clicks share one request, and a failure is dropped so the next click retries.
 */
const hintCache = new Map<string, Promise<DsaHint>>();
const editorialCache = new Map<string, Promise<DsaEditorial>>();

const remember = <T,>(
    cache: Map<string, Promise<T>>,
    key: string,
    load: () => Promise<T>
): Promise<T> => {
    const existing = cache.get(key);
    if (existing) return existing;
    const pending = load().catch((err: unknown) => {
        cache.delete(key);
        throw err;
    });
    cache.set(key, pending);
    return pending;
};

/** The `n`th hint, counting from one. */
export const fetchDsaHint = (problemId: string, n: number): Promise<DsaHint> =>
    remember(hintCache, `${problemId}:${n}`, () =>
        apiFetchJson<DsaHint>(`/api/dsa/problems/${problemId}/hints/${n}`)
    );

/** Every approach with its reasoning and code. The page asks before showing it. */
export const fetchDsaEditorial = (problemId: string): Promise<DsaEditorial> =>
    remember(editorialCache, problemId, () =>
        apiFetchJson<DsaEditorial>(`/api/dsa/problems/${problemId}/editorial`)
    );

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

/** Resolves to the same result, after telling cached progress (the dashboard, the tile) it is stale. */
const changesProgress = <T>(request: Promise<T>): Promise<T> =>
    request.then(result => {
        progressChanged();
        return result;
    });

export const submitDsaProblem = (
    problemId: string,
    language: string,
    code: string
): Promise<DsaSubmitResult> =>
    changesProgress(
        apiFetchJson<DsaSubmitResult>(`/api/dsa/problems/${problemId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, code })
        })
    );

export const answerDsaCheck = (checkId: string, selectedOption: string): Promise<DsaCheckAnswer> =>
    changesProgress(
        apiFetchJson<DsaCheckAnswer>(`/api/dsa/checks/${checkId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedOption })
        })
    );

export const setDsaProblemStatus = (
    problemId: string,
    status: DsaProgressStatus
): Promise<DsaProblemProgress> =>
    changesProgress(
        apiFetchJson<DsaProblemProgress>(`/api/me/dsa/problems/${problemId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
    );



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
 *
 * Held for half a minute so every return to the dashboard does not refetch it; solving or marking
 * a problem drops it at once (see `changesProgress`).
 */
const dsaSummary = cachedResource(
    async (): Promise<DsaSummary | null> => {
        const response = await apiFetch('/api/me/dsa/summary');
        if (response.status === 204) return null;
        if (!response.ok) throw new Error('Failed to fetch DSA summary');
        return response.json() as Promise<DsaSummary>;
    },
    { maxAgeMs: 30_000, resetOnProgress: true }
);

export const fetchDsaSummary = (force: boolean = false): Promise<DsaSummary | null> =>
    dsaSummary.get(force);

/** The cached summary if still fresh: a value, null for "no sheet", undefined for "not known". */
export const peekDsaSummary = (): DsaSummary | null | undefined => dsaSummary.peek();
