import { describe, expect, it } from 'vitest';
import { buildSectionTree, shouldShowSections } from './sectionTree';
import type { DsaProblemRow, DsaSectionRef } from '../../api/dsa.api';

let seq = 0;
const problem = (path: DsaSectionRef[]): DsaProblemRow => ({
    id: `p-${seq++}`,
    slug: `p-${seq}`,
    title: `Problem ${seq}`,
    difficulty: 'EASY',
    estimatedMinutes: 5,
    tags: [],
    hasVideo: false,
    sectionPath: path,
    status: 'NOT_STARTED',
    bookmarked: false
});

const ref = (id: string, title: string | null, depth: number): DsaSectionRef => ({
    id,
    title,
    depth
});

/**
 * The tree is derived on the client from each problem's ancestry, so that a flat paginated list can
 * still render as a hierarchy of any depth. These cover the cases where a naive implementation is
 * quietly wrong.
 */
describe('buildSectionTree', () => {
    it('groups problems under their section', () => {
        const tree = buildSectionTree([
            problem([ref('a', 'Input and output', 0)]),
            problem([ref('a', 'Input and output', 0)]),
            problem([ref('b', 'Arrays', 0)])
        ]);

        expect(tree.map(n => n.title)).toEqual(['Input and output', 'Arrays']);
        expect(tree[0].problems).toHaveLength(2);
        expect(tree[1].problems).toHaveLength(1);
    });

    it('rejoins a section that spans two pages', () => {
        // Page one ended mid-section. Looking the node up by id is what makes the continuation
        // land in the existing group instead of starting a second one with the same name.
        const tree = buildSectionTree([
            problem([ref('a', 'Arrays', 0)]),
            problem([ref('a', 'Arrays', 0)]),
            problem([ref('a', 'Arrays', 0)])
        ]);

        expect(tree).toHaveLength(1);
        expect(tree[0].problems).toHaveLength(3);
    });

    it('keeps two same-named sections apart', () => {
        const tree = buildSectionTree([
            problem([ref('a', 'Practice', 0)]),
            problem([ref('b', 'Practice', 0)])
        ]);

        expect(tree).toHaveLength(2);
    });

    it('nests to four levels', () => {
        // The point of deriving the tree from the ancestry: depth is data, not structure.
        const tree = buildSectionTree([
            problem([
                ref('l1', 'Binary search', 0),
                ref('l2', 'On answers', 1),
                ref('l3', 'Minimise the maximum', 2),
                ref('l4', 'Hard variants', 3)
            ])
        ]);

        expect(tree).toHaveLength(1);
        const l2 = tree[0].children[0];
        const l3 = l2.children[0];
        const l4 = l3.children[0];
        expect([tree[0].title, l2.title, l3.title, l4.title]).toEqual([
            'Binary search',
            'On answers',
            'Minimise the maximum',
            'Hard variants'
        ]);
        expect(l4.problems).toHaveLength(1);
    });

    it('rolls descendant counts up to each ancestor', () => {
        // A parent's header reports everything beneath it, not just what sits directly inside.
        const tree = buildSectionTree([
            problem([ref('l1', 'Arrays', 0)]),
            problem([ref('l1', 'Arrays', 0), ref('l2', 'Two pointers', 1)]),
            problem([ref('l1', 'Arrays', 0), ref('l2', 'Two pointers', 1)])
        ]);

        expect(tree[0].totalProblems).toBe(3);
        expect(tree[0].problems).toHaveLength(1);
        expect(tree[0].children[0].totalProblems).toBe(2);
    });

    it('keeps a problem with no ancestry rather than dropping it', () => {
        const tree = buildSectionTree([problem([])]);
        expect(tree).toHaveLength(1);
        expect(tree[0].problems).toHaveLength(1);
    });
});

describe('shouldShowSections', () => {
    it('is flat for one untitled root section', () => {
        // The optional-grouping case: a heading here would repeat the step's own name.
        expect(shouldShowSections(buildSectionTree([problem([ref('only', null, 0)])]))).toBe(false);
    });

    it('shows a single section that has a name', () => {
        expect(shouldShowSections(buildSectionTree([problem([ref('a', 'Arrays', 0)])]))).toBe(true);
    });

    it('shows an untitled root that has children', () => {
        expect(
            shouldShowSections(
                buildSectionTree([problem([ref('root', null, 0), ref('kid', 'Nested', 1)])])
            )
        ).toBe(true);
    });
});
