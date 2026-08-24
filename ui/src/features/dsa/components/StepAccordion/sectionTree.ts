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
            totalProblems: 0
        };
        byId.set(ref.id, created);
        siblings.push(created);
        return created;
    };

    for (const problem of problems) {
        // A server that predates sectionPath sends nothing here. Treating that as "one section"
        // would silently merge every problem in the step under the first one's heading — which is
        // exactly what an unrestarted backend produced — so an absent path is the ungrouped case.
        const path = (problem.sectionPath ?? []).filter(ref => Boolean(ref?.id));

        if (path.length === 0) {
            // A problem with no ancestry should not happen, but dropping it silently would be
            // worse than showing it ungrouped.
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

    // Roll the counts up once the tree is complete, so a parent header can report everything
    // beneath it rather than only what sits directly inside it.
    const total = (node: SectionNode): number => {
        node.totalProblems =
            node.problems.length + node.children.reduce((sum, child) => sum + total(child), 0);
        return node.totalProblems;
    };
    roots.forEach(total);

    return roots;
};

/**
 * Whether the tree is worth showing as a tree.
 *
 * A step whose problems all sit in one untitled root section is the flat case — that is what makes
 * the grouping level optional — and a lone heading there would just repeat the step's own name.
 */
export const shouldShowSections = (nodes: SectionNode[]): boolean =>
    nodes.length > 1 || Boolean(nodes[0]?.title) || Boolean(nodes[0]?.children.length);
