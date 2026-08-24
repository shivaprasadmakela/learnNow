import { describe, expect, it } from 'vitest';
import { parseRoute, routeToPath, type ViewState } from './parseRoute';

/**
 * The URL used to be parsed in three separate places — the state initialiser, the popstate handler,
 * and the pushState switch — so a route added to two of them worked on navigation and 404'd on hard
 * refresh, or the reverse. This is the table that made that impossible.
 */
describe('parseRoute', () => {
    it.each<[string, ViewState]>([
        ['/', 'HOME'],
        ['/dashboard', 'DASHBOARD'],
        ['/login', 'LOGIN'],
        ['/verify-email', 'VERIFY_EMAIL'],
        ['/compiler', 'COMPILER'],
        ['/compiler/python', 'COMPILER'],
        ['/paths', 'PATHS'],
        ['/paths/java-backend', 'TOPICS'],
        ['/paths/java-backend/collections', 'STUDY'],
        ['/dsa', 'DSA'],
        ['/dsa/binary-search/bs-lower-bound', 'DSA_PROBLEM'],
        ['/iamAdmin', 'ADMIN'],
        ['/iamAdmin/create-path', 'ADMIN_CREATE_PATH'],
        ['/iamAdmin/import', 'ADMIN_IMPORT_COURSE'],
        ['/iamAdmin/paths/abc-123', 'ADMIN_EDIT_PATH']
    ])('routes %s to %s', (pathname, expected) => {
        expect(parseRoute(pathname).view).toBe(expected);
    });

    it('pulls the step and problem slugs out of a problem URL', () => {
        const parsed = parseRoute('/dsa/binary-search/bs-lower-bound');
        expect(parsed.dsaStepSlug).toBe('binary-search');
        expect(parsed.dsaProblemSlug).toBe('bs-lower-bound');
    });

    it('pulls the path id out of an admin edit URL', () => {
        expect(parseRoute('/iamAdmin/paths/abc-123').editingPathId).toBe('abc-123');
    });

    it('does not mistake the revision list for a problem', () => {
    });

    it('tolerates trailing slashes and repeated separators', () => {
        expect(parseRoute('/dsa//').view).toBe('DSA');
        expect(parseRoute('/dashboard/').view).toBe('DASHBOARD');
    });

    it('falls back to home for anything unrecognised', () => {
        expect(parseRoute('/nope/nowhere').view).toBe('HOME');
    });
});

describe('routeToPath', () => {
    it.each<[ViewState, string]>([
        ['DASHBOARD', '/dashboard'],
        ['PATHS', '/paths'],
        ['DSA', '/dsa'],
        ['ADMIN', '/iamAdmin']
    ])('builds %s as %s', (view, expected) => {
        expect(routeToPath(view)).toBe(expected);
    });

    it('round-trips a DSA problem back to the same view and slugs', () => {
        const path = routeToPath('DSA_PROBLEM', 'binary-search', 'bs-lower-bound');
        const parsed = parseRoute(path);

        expect(parsed.view).toBe('DSA_PROBLEM');
        expect(parsed.dsaStepSlug).toBe('binary-search');
        expect(parsed.dsaProblemSlug).toBe('bs-lower-bound');
    });

    it('round-trips an admin path edit', () => {
        const parsed = parseRoute(routeToPath('ADMIN_EDIT_PATH', 'abc-123'));
        expect(parsed.view).toBe('ADMIN_EDIT_PATH');
        expect(parsed.editingPathId).toBe('abc-123');
    });
});
