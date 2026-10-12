-- ============================================================================
-- Editorial code in more than one language
-- ============================================================================
--
-- An approach used to carry exactly one `language` + `code` pair, so the editorial could only
-- ever show a single language even though every problem is judged in several. `solutions` holds
-- one entry per language instead:
--
--     [{"language": "java", "code": "class Solution { ... }"}, ...]
--
-- Expand only. The old columns are copied across and left in place, unread by the application,
-- so a revision still serving traffic during a rolling deploy keeps working. Drop them in a later
-- migration once no running revision reads them.

ALTER TABLE dsa_approaches
    ADD COLUMN solutions JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE dsa_approaches
SET solutions = jsonb_build_array(
        jsonb_build_object(
            'language', lower(btrim(coalesce(nullif(btrim(language), ''), 'java'))),
            'code', code))
WHERE code IS NOT NULL
  AND btrim(code) <> '';

ALTER TABLE dsa_approaches
    ADD CONSTRAINT ck_dsa_approaches_solutions_array
        CHECK (jsonb_typeof(solutions) = 'array');

COMMENT ON COLUMN dsa_approaches.solutions IS
  'The approach''s code, one {language, code} object per language. The editorial offers a '
  'language switcher over exactly these.';
COMMENT ON COLUMN dsa_approaches.language IS
  'Deprecated by solutions (V3). No longer read or written; kept for rolling deploys.';
COMMENT ON COLUMN dsa_approaches.code IS
  'Deprecated by solutions (V3). No longer read or written; kept for rolling deploys.';
