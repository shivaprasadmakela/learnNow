-- ============================================================================
-- V2 — Topic-level learner notes
--
-- The study console keeps one notes drawer per topic, alongside the existing
-- per-subtopic notes. Topic notes get their own table so the subtopic FK on
-- subtopic_notes stays honest.
-- ============================================================================

CREATE TABLE topic_notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    VARCHAR(255) NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    topic_id   UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    content    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_topic_notes_user_topic UNIQUE (user_id, topic_id)
);

COMMENT ON TABLE  topic_notes IS 'Private per-topic notes. Visible only to their author.';
COMMENT ON COLUMN topic_notes.content IS 'Markdown. Rendered through an escaping renderer, never as raw HTML.';

CREATE INDEX idx_topic_notes_user ON topic_notes (user_id);
CREATE INDEX idx_topic_notes_topic ON topic_notes (topic_id);

CREATE TRIGGER trg_topic_notes_updated_at
    BEFORE UPDATE ON topic_notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
