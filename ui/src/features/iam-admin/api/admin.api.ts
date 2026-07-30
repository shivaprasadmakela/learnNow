import { apiFetch } from '../../../shared/api/client';

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

export const fetchAdminPaths = async (): Promise<AdminPathData[]> => {
    const res = await apiFetch('/api/admin/paths');
    if (!res.ok) throw new Error('Failed to fetch admin paths');
    return res.json();
};

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


