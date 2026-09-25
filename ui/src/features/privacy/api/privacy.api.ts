import { apiFetch, apiFetchJson } from '../../../shared/api/client';

/**
 * The learner's rights under the Digital Personal Data Protection Act, 2023.
 *
 * Each call here corresponds to a section of the Act, and the section is named on the function
 * rather than left in a design document — when someone changes one of these later, the thing they
 * need to know is which obligation it is carrying.
 */

export type ConsentPurpose =
    | 'ESSENTIAL'
    | 'PRODUCT_ANALYTICS'
    | 'MARKETING_EMAILS'
    | 'PERSONALISATION';

export interface ConsentDto {
    purpose: ConsentPurpose;
    granted: boolean;
    /** Refusing a required purpose is closing the account, which is offered separately. */
    required: boolean;
    /** The notice version this answer was given against; null when never answered. */
    noticeVersion: string | null;
    decidedAt: string | null;
}

export interface ConsentCentreDto {
    currentNoticeVersion: string;
    consents: ConsentDto[];
}

export interface NomineeDto {
    name: string;
    email: string;
    relationship: string | null;
    createdAt: string;
    updatedAt: string;
}

export type GrievanceCategory =
    | 'DATA_ACCESS'
    | 'DATA_CORRECTION'
    | 'DATA_ERASURE'
    | 'CONSENT'
    | 'SECURITY'
    | 'OTHER';

export type GrievanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface GrievanceDto {
    reference: string;
    category: GrievanceCategory;
    subject: string;
    body: string;
    status: GrievanceStatus;
    response: string | null;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
}

export interface PrivacyContactDto {
    entityName: string;
    grievanceOfficerName: string;
    grievanceOfficerEmail: string;
    grievanceOfficerAddress: string;
    grievanceResponseDays: number;
    noticeVersion: string;
}

/** Human labels for the purposes, kept beside the type so a new purpose cannot ship unlabelled. */
export const CONSENT_LABELS: Record<ConsentPurpose, { title: string; description: string }> = {
    ESSENTIAL: {
        title: 'Running your account',
        description:
            'Signing you in, saving your progress, and sending service email such as password resets. This is what an account is, so it cannot be switched off while you have one — closing your account below withdraws it entirely.'
    },
    PRODUCT_ANALYTICS: {
        title: 'Improving the courses',
        description:
            'Measuring which lessons people finish and where they get stuck, so the material can be improved. Never used to target advertising.'
    },
    MARKETING_EMAILS: {
        title: 'Course announcements',
        description:
            'Occasional email about new paths, problem sheets and features. Not used for anything else, and never shared.'
    },
    PERSONALISATION: {
        title: 'Recommendations',
        description:
            'Using what you have studied to suggest what to study next. Switching this off leaves the catalogue in its default order.'
    }
};

export const GRIEVANCE_CATEGORY_LABELS: Record<GrievanceCategory, string> = {
    DATA_ACCESS: 'Access to my data',
    DATA_CORRECTION: 'Correcting my data',
    DATA_ERASURE: 'Erasing my data',
    CONSENT: 'Consent',
    SECURITY: 'Security concern',
    OTHER: 'Something else'
};

/** s.8(9). Public — a person who cannot sign in is the one most likely to need it. */
export const fetchPrivacyContact = (): Promise<PrivacyContactDto> =>
    apiFetchJson<PrivacyContactDto>('/api/privacy/contact');

/** s.6. */
export const fetchConsents = (): Promise<ConsentCentreDto> =>
    apiFetchJson<ConsentCentreDto>('/api/me/privacy/consents');

/**
 * s.6(4). One call for both granting and withdrawing, which is what "as easy to withdraw as to
 * give" means once it reaches the wire.
 */
export const updateConsents = (
    decisions: Array<{ purpose: ConsentPurpose; granted: boolean }>
): Promise<ConsentCentreDto> =>
    apiFetchJson<ConsentCentreDto>('/api/me/privacy/consents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisions })
    });

/**
 * s.11. Downloads everything held about the learner.
 *
 * Handled as a blob rather than through apiFetchJson because the point is to put a file on their
 * disk, not to render JSON. The filename comes from Content-Disposition so the server stays the
 * one deciding what the export is called.
 */
export const downloadMyData = async (): Promise<void> => {
    const response = await apiFetch('/api/me/privacy/export');
    if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
    }

    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? 'learnnow-my-data.json';

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        // Revoking synchronously after click() is safe: the browser has already taken its
        // own reference to the blob by then, and leaving it would hold the whole export in
        // memory for the life of the tab.
        URL.revokeObjectURL(url);
    }
};

/** s.12(3). Irreversible; the caller is responsible for confirming first. */
export const eraseAccount = async (): Promise<void> => {
    const response = await apiFetch('/api/me/privacy/account', { method: 'DELETE' });
    if (!response.ok) {
        throw new Error(`Account deletion failed (${response.status})`);
    }
};

/** s.14. Resolves to null when nobody is nominated — the server answers 204, not 404. */
export const fetchNominee = async (): Promise<NomineeDto | null> => {
    const response = await apiFetch('/api/me/privacy/nominee');
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`Could not load nominee (${response.status})`);
    return response.json() as Promise<NomineeDto>;
};

export const saveNominee = (nominee: {
    name: string;
    email: string;
    relationship?: string;
}): Promise<NomineeDto> =>
    apiFetchJson<NomineeDto>('/api/me/privacy/nominee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nominee)
    });

export const deleteNominee = async (): Promise<void> => {
    const response = await apiFetch('/api/me/privacy/nominee', { method: 'DELETE' });
    if (!response.ok) throw new Error(`Could not remove nominee (${response.status})`);
};

/** s.13. */
export const fetchGrievances = (): Promise<GrievanceDto[]> =>
    apiFetchJson<GrievanceDto[]>('/api/me/privacy/grievances');

export const raiseGrievance = (grievance: {
    category: GrievanceCategory;
    subject: string;
    body: string;
}): Promise<GrievanceDto> =>
    apiFetchJson<GrievanceDto>('/api/me/privacy/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grievance)
    });
