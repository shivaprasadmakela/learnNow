import { apiFetch } from '../../../shared/api/client';

export interface AdminSubtopicData {
    id?: string;
    title: string;
    content: string;
    orderIndex: number;
    status: 'DRAFT' | 'PUBLISHED';
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
