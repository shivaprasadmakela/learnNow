-- ============================================================================
-- An explicit order for quiz questions
-- ============================================================================
--
-- A lesson's questions had no order column; they came back in whatever order the rows were
-- stored. That held only because every course import deleted and recreated them all, which also
-- gave each question a new id and cascaded away every learner's answers to it. Imports now update
-- questions in place, so their order has to be stored rather than implied.
--
-- Expand only: one new column, filled from the order the rows are stored in today, which is the
-- order learners currently see.

ALTER TABLE quiz_questions ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;

UPDATE quiz_questions q
SET order_index = ranked.position
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY block_id ORDER BY ctid) - 1 AS position
    FROM quiz_questions
) ranked
WHERE q.id = ranked.id;

COMMENT ON COLUMN quiz_questions.order_index IS
  'Position within its quiz block, from 0. Set by the importer and the admin editor.';
