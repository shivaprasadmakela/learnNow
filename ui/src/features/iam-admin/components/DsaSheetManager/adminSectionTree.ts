import type { AdminDsaProblemRow, AdminDsaSection } from '../../../dsa/api/adminDsa.api';

export interface AdminSectionNode {
    id: string;
    title: string | null;
    description: string | null;
    depth: number;
    /** Problems sitting directly in this section, rendered above its children. */
    problems: AdminDsaProblemRow[];
    children: AdminSectionNode[];
    /** This section's problems plus every descendant's. */
    totalProblems: number;
    draftProblems: number;
    /** Problems with at least one test case still missing its expected output. */
    incompleteProblems: number;
}

/**
 * Rebuilds the authoring tree from the flat, tree-ordered section list.
 *
 * This is not the learner-side `buildSectionTree`, and the difference is the input rather than a
 * missed chance to share: the learner rebuilds the tree from each problem's ancestry because its
 * problems are paginated and arrive a page at a time, while the authoring endpoint sends the whole
 * step at once with an explicit parent on every section. Forcing one function to do both would
 * mean carrying a fake ancestry through the admin payload. What the two do share - the recursive
 * `Collapsible` that renders the result - is the part that was actually duplicated.
 *
 * A section whose parent is missing from the list is treated as a root rather than dropped. Losing
 * a subtree silently is the failure mode that takes longest to notice.
 */
export const buildAdminSectionTree = (sections: AdminDsaSection[]): AdminSectionNode[] => {
    const byId = new Map<string, AdminSectionNode>();
    const roots: AdminSectionNode[] = [];

    for (const section of sections) {
        byId.set(section.id, {
            id: section.id,
            title: section.title ?? null,
            description: section.description ?? null,
            depth: section.depth ?? 0,
            problems: section.problems ?? [],
            children: [],
            totalProblems: 0,
            draftProblems: 0,
            incompleteProblems: 0
        });
    }

    for (const section of sections) {
        const node = byId.get(section.id)!;
        const parent = section.parentSectionId ? byId.get(section.parentSectionId) : undefined;
        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const rollUp = (node: AdminSectionNode) => {
        let total = node.problems.length;
        let drafts = node.problems.filter(p => p.status === 'DRAFT').length;
        let incomplete = node.problems.filter(p => p.missingExpectedCount > 0).length;

        for (const child of node.children) {
            rollUp(child);
            total += child.totalProblems;
            drafts += child.draftProblems;
            incomplete += child.incompleteProblems;
        }

        node.totalProblems = total;
        node.draftProblems = drafts;
        node.incompleteProblems = incomplete;
    };

    roots.forEach(rollUp);
    return roots;
};
