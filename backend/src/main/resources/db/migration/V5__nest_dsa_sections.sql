-- ============================================================================
-- V5 — Sections nest
--
-- V3 gave the sheet three fixed levels: step, section, problem. The content
-- wants more — a step's section splitting into sub-sections, and a fourth level
-- after that — so sections become a tree rather than a single layer.
--
-- On ordering a tree
-- ------------------
-- Problems are paginated, so the database has to be able to order them in
-- tree order without the application's help. A recursive CTE could do it at
-- read time, but it would run on every page of every step.
--
-- Instead each section stores a materialised `path`: its ancestors' order
-- indexes, zero-padded and dot-joined ('003', '003.001', '003.001.002').
-- Sorting by that string is tree order, it is a plain btree index, and it costs
-- nothing to read. The price is that the path must be rewritten when a section
-- moves, which the authoring service owns -- a fair trade for a structure that
-- is written rarely and read constantly.
--
-- Zero-padding to three digits caps a level at 999 siblings. Well past what a
-- sheet needs, and without it '10' sorts before '2'.
-- ============================================================================

ALTER TABLE dsa_sections
    ADD COLUMN parent_section_id UUID REFERENCES dsa_sections(id) ON DELETE CASCADE,
    ADD COLUMN depth             INT NOT NULL DEFAULT 0,
    ADD COLUMN path              VARCHAR(255) NOT NULL DEFAULT '';

COMMENT ON COLUMN dsa_sections.parent_section_id IS
  'Null for a top-level section. Cascades, so deleting a section takes its whole subtree.';
COMMENT ON COLUMN dsa_sections.depth IS
  'Zero for a top-level section. Derived from the parent chain; stored so the UI can indent '
  'without walking it.';
COMMENT ON COLUMN dsa_sections.path IS
  'Ancestor order indexes, zero-padded and dot-joined. Sorting by this is tree order. '
  'Maintained on write by the authoring and import services.';

-- Existing sections are all top level, so their path is their own order index.
UPDATE dsa_sections SET depth = 0, path = lpad(order_index::text, 3, '0');

CREATE INDEX idx_dsa_sections_parent ON dsa_sections (parent_section_id);
CREATE INDEX idx_dsa_sections_path   ON dsa_sections (step_id, path);

-- ----------------------------------------------------------------------------
-- Uniqueness is now per parent, not per step: two sub-sections under different
-- parents may both be the first of their group.
--
-- A plain UNIQUE (step_id, parent_section_id, order_index) would not constrain
-- the top level at all, because Postgres treats NULLs as distinct and every
-- root section has a NULL parent. So it takes two partial indexes.
-- ----------------------------------------------------------------------------

ALTER TABLE dsa_sections DROP CONSTRAINT uq_dsa_sections_step_order;

CREATE UNIQUE INDEX uq_dsa_sections_root_order
    ON dsa_sections (step_id, order_index) WHERE parent_section_id IS NULL;

CREATE UNIQUE INDEX uq_dsa_sections_child_order
    ON dsa_sections (parent_section_id, order_index) WHERE parent_section_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- A section may now hold sub-sections instead of problems, so the two are not
-- mutually exclusive in the schema -- a section with both renders its problems
-- above its children. Nothing to enforce, but worth stating.
-- ----------------------------------------------------------------------------

COMMENT ON TABLE dsa_sections IS
  'A grouping level inside a step, nestable to any depth. May hold problems, sub-sections, or '
  'both. A step whose problems sit in one untitled root section renders flat.';
