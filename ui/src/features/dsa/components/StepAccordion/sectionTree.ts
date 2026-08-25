import type { DsaProblemRow, DsaSectionRef } from '../../api/dsa.api';

export interface SectionNode {
    id: string;
    title: string | null;
    depth: number;
    /** Problems directly in this section, above its children. */
    problems: DsaProblemRow[];
    children: SectionNode[];
    /** This section's problems plus every descendant's — what the header counts. */
    totalProblems: number;
    /** Number of solved problems in this section and its descendants. */
    solvedProblems: number;
}

/**
 * Rebuilds the section tree from a flat page of problems.
 *
 * Each problem carries its full ancestry, so the tree is derived rather than fetched. Three
 * consequences, all of them the reason it works this way:
 *
 *   - Pagination keeps working. There is no separate tree endpoint to page or to keep in sync.
 *   - A section split across two pages rejoins itself, because nodes are keyed by id and looked up
 *     rather than appended blindly.
 *   - Depth is whatever the data says. A fourth or fifth level needs no change here.
 *
 * The server returns problems in tree order (sections sort by a materialised path), so insertion
 * order is already the order to render.
 */
export const buildSectionTree = (problems: DsaProblemRow[]): SectionNode[] => {
    const roots: SectionNode[] = [];
    const byId = new Map<string, SectionNode>();

    const nodeFor = (ref: DsaSectionRef, siblings: SectionNode[]): SectionNode => {
        const existing = byId.get(ref.id);
        if (existing) return existing;

        const created: SectionNode = {
            id: ref.id,
            title: ref.title ?? null,
            depth: ref.depth,
            problems: [],
            children: [],
            totalProblems: 0,
            solvedProblems: 0
        };
        byId.set(ref.id, created);
        siblings.push(created);
        return created;
    };

    for (const problem of problems) {
        const path = (problem.sectionPath ?? []).filter(ref => Boolean(ref?.id));

        if (path.length === 0) {
            const orphan = nodeFor({ id: '__ungrouped__', title: null, depth: 0 }, roots);
            orphan.problems.push(problem);
            continue;
        }

        let siblings = roots;
        let node: SectionNode | null = null;

        for (const ref of path) {
            node = nodeFor(ref, siblings);
            siblings = node.children;
        }

        node!.problems.push(problem);
    }

    // Roll both the total problem count and the solved count up once the tree is complete
    const calculateTotals = (node: SectionNode): { total: number; solved: number } => {
        let directSolved = node.problems.filter(p => p.status === 'SOLVED').length;
        let directTotal = node.problems.length;

        for (const child of node.children) {
            const childCounts = calculateTotals(child);
            directTotal += childCounts.total;
            directSolved += childCounts.solved;
        }

        node.totalProblems = directTotal;
        node.solvedProblems = directSolved;
        return { total: directTotal, solved: directSolved };
    };

    roots.forEach(calculateTotals);

    return roots;
};

/**
 * Whether the tree is worth showing as a tree.
 */
export const shouldShowSections = (nodes: SectionNode[]): boolean =>
    nodes.length > 1 || Boolean(nodes[0]?.title) || Boolean(nodes[0]?.children.length);
