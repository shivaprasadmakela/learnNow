import { apiFetch } from '../../../shared/api/client';
import {
    DEFAULT_PAGE_SIZE,
    fetchAllPages,
    toPageResponse,
    withPageParams,
    type PageResponse
} from '../../../shared/api/pagination';

export interface QuizQuestionDto {
    id?: string;
    kind: 'mcq' | 'true_false' | 'fill_blank';
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    points?: number;
}

export interface AdminSubtopicData {
    id?: string;
    title: string;
    content: string;
    orderIndex: number;
    status: 'DRAFT' | 'PUBLISHED';
    questions?: QuizQuestionDto[];
}

export interface AdminTopicData {
    id?: string;
    title: string;
    description: string;
    category: string;
    level?: string;
    track?: string;
    duration: string;
    orderIndex?: number;
    status: 'DRAFT' | 'PUBLISHED';
    subtopics: AdminSubtopicData[];
}

export interface AdminPathData {
    id?: string;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    status: 'DRAFT' | 'PUBLISHED';
    topics: AdminTopicData[];
}

export const fetchAdminPathsPage = async (
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE
): Promise<PageResponse<AdminPathData>> => {
    const res = await apiFetch(withPageParams('/api/admin/paths', page, size));
    if (!res.ok) throw new Error('Failed to fetch admin paths');
    return toPageResponse<AdminPathData>(await res.json(), size);
};

/** First page only - the authoring grid scrolls for the rest via {@link fetchAdminPathsPage}. */
export const fetchAdminPaths = async (): Promise<AdminPathData[]> => {
    const result = await fetchAdminPathsPage();
    return result.content;
};

/**
 * Every path, walked page by page. The importer offers them in a `<select>`, which has nothing to
 * scroll and no way to ask for more, so it needs the complete list up front.
 */
export const fetchAllAdminPaths = async (): Promise<AdminPathData[]> =>
    fetchAllPages<AdminPathData>((page, size) => fetchAdminPathsPage(page, size));

export const fetchAdminPathById = async (id: string): Promise<AdminPathData> => {
    const res = await apiFetch(`/api/admin/paths/${id}`);
    if (!res.ok) throw new Error('Failed to fetch admin path');
    return res.json();
};

export const saveAdminPath = async (path: AdminPathData): Promise<AdminPathData> => {
    const isUpdate = !!path.id;
    const url = isUpdate ? `/api/admin/paths/${path.id}` : '/api/admin/paths';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(path)
    });
    if (!res.ok) throw new Error('Failed to save admin path');
    return res.json();
};

export const publishAdminPath = async (id: string): Promise<AdminPathData> => {
    const res = await apiFetch(`/api/admin/paths/${id}/publish`, {
        method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to publish path');
    return res.json();
};

export interface ImportResultDto {
    pathId: string;
    pathTitle: string;
    topicsCreated: number;
    subtopicsCreated: number;
    questionsCreated: number;
    status: string;
    mode: 'CREATED' | 'APPENDED';
}

export interface ImportConflictItemDto {
    level: 'PATH' | 'TOPIC' | 'SUBTOPIC';
    entityName: string;
    existingId?: string;
    message: string;
}

export interface ImportValidationResultDto {
    hasConflicts: boolean;
    conflicts: ImportConflictItemDto[];
}

export interface ImportCoursePayload {
    pathId?: string | null;
    title?: string;
    description?: string;
    category?: string;
    managedBy?: string;
    conflictStrategy?: 'FAIL_ON_CONFLICT' | 'OVERWRITE' | 'SKIP_EXISTING' | 'KEEP_BOTH';
    topics: unknown[];
}

export const validateImportConflicts = async (payload: ImportCoursePayload): Promise<ImportValidationResultDto> => {
    const res = await apiFetch('/api/admin/paths/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        throw new Error('Failed to validate course conflicts');
    }
    return res.json();
};

export const importCourse = async (payload: ImportCoursePayload): Promise<ImportResultDto> => {
    const res = await apiFetch('/api/admin/paths/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to import course JSON');
    }
    return res.json();
};

export const deleteAdminPath = async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/paths/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete path');
};

export const fetchAdminTopicsLibraryPage = async (
    page: number = 0,
    size: number = DEFAULT_PAGE_SIZE
): Promise<PageResponse<AdminTopicData>> => {
    const res = await apiFetch(withPageParams('/api/admin/topics', page, size));
    if (!res.ok) throw new Error('Failed to fetch admin topics library');
    return toPageResponse<AdminTopicData>(await res.json(), size);
};

export const fetchAdminTopicsLibrary = async (): Promise<AdminTopicData[]> => {
    const result = await fetchAdminTopicsLibraryPage();
    return result.content;
};


