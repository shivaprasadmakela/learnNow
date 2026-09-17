import { describe, expect, it } from 'vitest';
import { buildAdminSectionTree } from './adminSectionTree';
import type { AdminDsaProblemRow, AdminDsaSection } from '../../../dsa/api/adminDsa.api';

const problem = (over: Partial<AdminDsaProblemRow> = {}): AdminDsaProblemRow => ({
    id: Math.random().toString(36).slice(2),
    slug: 'p',
    title: 'A problem',
    difficulty: 'EASY',
    status: 'PUBLISHED',
    orderIndex: 1,
    hasVideo: false,
    harnessCount: 1,
    testCaseCount: 2,
    missingExpectedCount: 0,
    ...over
});

const section = (over: Partial<AdminDsaSection> & { id: string }): AdminDsaSection => ({
    parentSectionId: null,
    orderIndex: 1,
    depth: 0,
    problems: [],
    ...over
});

describe('buildAdminSectionTree', () => {
    it('nests children under their parent', () => {
        const tree = buildAdminSectionTree([
            section({ id: 'a', title: 'Basics' }),
            section({ id: 'b', parentSectionId: 'a', depth: 1, title: 'Loops' }),
            section({ id: 'c', parentSectionId: 'b', depth: 2, title: 'Nested loops' })
        ]);

        expect(tree).toHaveLength(1);
        expect(tree[0].children[0].id).toBe('b');
        expect(tree[0].children[0].children[0].id).toBe('c');
    });

    it('rolls counts up through every level', () => {
        const tree = buildAdminSectionTree([
            section({ id: 'a', problems: [problem()] }),
            section({
                id: 'b',
                parentSectionId: 'a',
                depth: 1,
                problems: [problem({ status: 'DRAFT' }), problem({ missingExpectedCount: 3 })]
            }),
            section({
                id: 'c',
                parentSectionId: 'b',
                depth: 2,
                problems: [problem({ status: 'DRAFT', missingExpectedCount: 1 })]
            })
        ]);

        expect(tree[0].totalProblems).toBe(4);
        expect(tree[0].draftProblems).toBe(2);
        expect(tree[0].incompleteProblems).toBe(2);
    });

    it('keeps a section whose parent is absent rather than dropping its subtree', () => {
        const tree = buildAdminSectionTree([
            section({ id: 'orphan', parentSectionId: 'not-in-this-payload', depth: 1 })
        ]);

        expect(tree.map(n => n.id)).toEqual(['orphan']);
    });

});
