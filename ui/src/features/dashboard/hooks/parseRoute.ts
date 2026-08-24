export type ViewState =
    | 'HOME'
    | 'DASHBOARD'
    | 'LOGIN'
    | 'PATHS'
    | 'TOPICS'
    | 'STUDY'
    | 'VERIFY_EMAIL'
    | 'COMPILER'
    | 'DSA'
    | 'DSA_PROBLEM'
    | 'ADMIN'
    | 'ADMIN_CREATE_PATH'
    | 'ADMIN_EDIT_PATH'
    | 'ADMIN_IMPORT_COURSE';

export interface ParsedRoute {
    view: ViewState;
    /** Set for ADMIN_EDIT_PATH. */
    editingPathId?: string;
    /** Set for DSA_PROBLEM. */
    dsaStepSlug?: string;
    dsaProblemSlug?: string;
}

/**
 * The single place a URL becomes a view.
 *
 * This used to be three separate ladders of if-statements — the state initialiser, the popstate
 * handler, and the pushState switch — which meant a route added to two of them worked on navigation
 * and 404'd on refresh, or the reverse. One function, called from all three, removes the whole class
 * of bug.
 */
export const parseRoute = (pathname: string): ParsedRoute => {
    const parts = pathname.split('/').filter(Boolean);
    const [first, second, third] = parts;

    if (parts.length === 1) {
        if (first === 'dashboard') return { view: 'DASHBOARD' };
        if (first === 'login') return { view: 'LOGIN' };
        if (first === 'verify-email') return { view: 'VERIFY_EMAIL' };
        if (first === 'paths') return { view: 'PATHS' };
        if (first === 'dsa') return { view: 'DSA' };
        if (first === 'iamAdmin') return { view: 'ADMIN' };
    }

    if (first === 'compiler') return { view: 'COMPILER' };

    if (first === 'dsa') {
        if (parts.length >= 3) {
            return { view: 'DSA_PROBLEM', dsaStepSlug: second, dsaProblemSlug: third };
        }
        return { view: 'DSA' };
    }

    if (first === 'paths') {
        if (parts.length === 2) return { view: 'TOPICS' };
        if (parts.length >= 3) return { view: 'STUDY' };
    }

    if (first === 'iamAdmin') {
        if (parts.length === 2 && second === 'create-path') return { view: 'ADMIN_CREATE_PATH' };
        if (parts.length === 2 && second === 'import') return { view: 'ADMIN_IMPORT_COURSE' };
        if (parts.length === 3 && second === 'paths') {
            return { view: 'ADMIN_EDIT_PATH', editingPathId: third };
        }
        return { view: 'ADMIN' };
    }

    return { view: 'HOME' };
};

/** The inverse of {@link parseRoute}. Kept beside it so the two cannot drift apart. */
export const routeToPath = (
    view: ViewState,
    slug?: string,
    subSlug?: string
): string => {
    switch (view) {
        case 'DASHBOARD':
            return '/dashboard';
        case 'LOGIN':
            return '/login';
        case 'VERIFY_EMAIL':
            return `/verify-email${slug ? `?token=${slug}` : ''}`;
        case 'COMPILER':
            return `/compiler/${slug || 'javascript'}`;
        case 'PATHS':
            return '/paths';
        case 'TOPICS':
            return `/paths/${slug || 'java-backend-path'}`;
        case 'STUDY':
            return `/paths/${slug || 'java-backend-path'}/${subSlug || ''}`;
        case 'DSA':
            return '/dsa';
        case 'DSA_PROBLEM':
            return `/dsa/${slug || 'step'}/${subSlug || ''}`;
        case 'ADMIN':
            return '/iamAdmin';
        case 'ADMIN_CREATE_PATH':
            return '/iamAdmin/create-path';
        case 'ADMIN_IMPORT_COURSE':
            return '/iamAdmin/import';
        case 'ADMIN_EDIT_PATH':
            return `/iamAdmin/paths/${slug || ''}`;
        default:
            return '/';
    }
};
