-- ============================================================================
-- V4 — One notes table, one bookmarks table
--
-- Notes had drifted into two tables (subtopic_notes, topic_notes) and V3 was
-- about to add a third for DSA problems. Bookmarks were topic-only, and V3 had
-- bolted a marked_for_revision flag onto DSA progress to do the same job for
-- problems. Four tables and a boolean for two concepts.
--
-- This consolidates each concept into one table, so "my notes" and "my
-- bookmarks" are single queries the UI can filter, rather than a union that
-- grows a branch every time a new kind of thing becomes noteable.
--
-- On the shape of the target reference
-- ------------------------------------
-- The obvious way to point at "any kind of thing" is a (target_type, target_id)
-- pair. It is rejected here: target_id can carry no foreign key, so deleting a
-- topic would silently leave notes pointing at nothing, and V1's header commits
-- this schema to indexing and cascading every reference.
--
-- Instead there is one nullable, properly-constrained FK column per target kind
-- and a CHECK that exactly one is populated. That keeps ON DELETE CASCADE doing
-- its job, keeps every reference indexed, and makes "only DSA bookmarks" a
-- plain indexed predicate. The cost is that a fourth kind of target needs a
-- migration rather than a new enum value -- which is a fair price for not being
-- able to orphan a row, and forces a moment's thought about cascade behaviour
-- each time.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION 1 — Notes
-- ----------------------------------------------------------------------------

CREATE TABLE notes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    subtopic_id    UUID REFERENCES subtopics(id)    ON DELETE CASCADE,
    topic_id       UUID REFERENCES topics(id)       ON DELETE CASCADE,
    dsa_problem_id UUID REFERENCES dsa_problems(id) ON DELETE CASCADE,

    content        TEXT NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_notes_exactly_one_target
        CHECK (num_nonnulls(subtopic_id, topic_id, dsa_problem_id) = 1)
);

COMMENT ON TABLE  notes IS
  'Private learner notes against any kind of content. Exactly one target column is set; '
  'which one it is *is* the note''s type, so there is no separate discriminator to keep honest.';
COMMENT ON COLUMN notes.content IS
  'Markdown. Rendered through an escaping renderer, never as raw HTML.';
COMMENT ON CONSTRAINT ck_notes_exactly_one_target ON notes IS
  'Rejects both a note pointing at nothing and a note pointing at two things at once.';

-- Uniqueness is per target kind, so the partial indexes double as the lookup
-- indexes for each kind. A plain UNIQUE across all three columns would treat
-- NULLs as distinct and let a learner accumulate duplicate notes on one target.
--
-- Names deliberately differ from V1's uq_notes_user_subtopic / uq_bookmarks_user_topic: those
-- constraints still exist on the old tables at this point in the script, and a UNIQUE constraint
-- owns an index of its own name.
CREATE UNIQUE INDEX uq_notes_subtopic
    ON notes (user_id, subtopic_id) WHERE subtopic_id IS NOT NULL;
CREATE UNIQUE INDEX uq_notes_topic
    ON notes (user_id, topic_id) WHERE topic_id IS NOT NULL;
CREATE UNIQUE INDEX uq_notes_dsa_problem
    ON notes (user_id, dsa_problem_id) WHERE dsa_problem_id IS NOT NULL;

CREATE INDEX idx_notes_user ON notes (user_id);

CREATE TRIGGER trg_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Carry the existing notes across. created_at and updated_at are preserved
-- explicitly: a learner's note dated today when they wrote it months ago is a
-- small betrayal of trust, and the trigger only fires on UPDATE so the INSERT
-- values stand.
INSERT INTO notes (user_id, subtopic_id, content, created_at, updated_at)
SELECT user_id, subtopic_id, content, created_at, updated_at FROM subtopic_notes;

INSERT INTO notes (user_id, topic_id, content, created_at, updated_at)
SELECT user_id, topic_id, content, created_at, updated_at FROM topic_notes;

DROP TABLE subtopic_notes;
DROP TABLE topic_notes;

-- Added by V3 and never written to by a released build.
DROP TABLE IF EXISTS user_dsa_problem_notes;


-- ----------------------------------------------------------------------------
-- SECTION 2 — Bookmarks
-- ----------------------------------------------------------------------------

CREATE TABLE bookmarks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    topic_id       UUID REFERENCES topics(id)       ON DELETE CASCADE,
    dsa_problem_id UUID REFERENCES dsa_problems(id) ON DELETE CASCADE,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_bookmarks_exactly_one_target
        CHECK (num_nonnulls(topic_id, dsa_problem_id) = 1)
);

COMMENT ON TABLE bookmarks IS
  'Saved-for-later, across content types. Replaces topic_bookmarks and the marked_for_revision '
  'flag on DSA progress -- both were the same idea wearing different clothes.';

CREATE UNIQUE INDEX uq_bookmarks_topic
    ON bookmarks (user_id, topic_id) WHERE topic_id IS NOT NULL;
CREATE UNIQUE INDEX uq_bookmarks_dsa_problem
    ON bookmarks (user_id, dsa_problem_id) WHERE dsa_problem_id IS NOT NULL;

CREATE INDEX idx_bookmarks_user ON bookmarks (user_id, created_at DESC);

INSERT INTO bookmarks (user_id, topic_id, created_at)
SELECT user_id, topic_id, created_at FROM topic_bookmarks;

DROP TABLE topic_bookmarks;


-- ----------------------------------------------------------------------------
-- SECTION 3 — Retire the DSA revision flag
--
-- Anything a learner starred for revision becomes a bookmark, so the flag's
-- meaning survives the column. The partial index on it goes automatically.
-- ----------------------------------------------------------------------------

INSERT INTO bookmarks (user_id, dsa_problem_id, created_at)
SELECT user_id, problem_id, updated_at
FROM user_dsa_problem_progress
WHERE marked_for_revision
ON CONFLICT DO NOTHING;

ALTER TABLE user_dsa_problem_progress DROP COLUMN marked_for_revision;
