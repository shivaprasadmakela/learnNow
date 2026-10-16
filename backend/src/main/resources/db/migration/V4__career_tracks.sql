-- ============================================================================
-- Career tracks
-- ============================================================================
--
-- A track is an ordered route through existing paths towards a role - "Java Full Stack Developer"
-- is Core Java, then SQL, then Spring Boot, and so on. It holds no content of its own: every step
-- points at a path, so a path finished on its own already counts towards every track that
-- includes it, and editing a path never needs a track touched.
--
-- Expand only: two new tables, nothing existing changes.

CREATE TABLE tracks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    order_index INTEGER NOT NULL DEFAULT 0,
    status      VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED'
                CONSTRAINT ck_tracks_status CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tracks_slug UNIQUE (slug),
    CONSTRAINT ck_tracks_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE  tracks IS 'A career track: an ordered route through existing paths towards a role.';
COMMENT ON COLUMN tracks.slug IS 'The URL name (/tracks/<slug>) and the key an import upserts by.';
COMMENT ON COLUMN tracks.order_index IS 'Position among tracks in the catalog; ties fall back to the title.';


CREATE TABLE track_steps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    path_id     UUID NOT NULL REFERENCES paths(id)  ON DELETE CASCADE,
    step_index  INTEGER NOT NULL,
    optional    BOOLEAN NOT NULL DEFAULT FALSE,
    note        VARCHAR(500),
    CONSTRAINT uq_track_steps_position UNIQUE (track_id, step_index),
    CONSTRAINT uq_track_steps_path     UNIQUE (track_id, path_id)
);

COMMENT ON TABLE  track_steps IS 'One path within a track, at a position. A path appears at most once per track.';
COMMENT ON COLUMN track_steps.optional IS 'Recommended but not required: left out of the track''s total time and progress.';
COMMENT ON COLUMN track_steps.note IS 'Why this step is here, shown under it on the roadmap.';

-- The unique constraints index (track_id, ...); deleting a path needs the reverse.
CREATE INDEX idx_track_steps_path ON track_steps (path_id);


-- ============================================================================
-- Interview question bank
-- ============================================================================
--
-- A quiz question checks whether a subtopic was understood. An interview question is a different
-- thing: it is what somebody was actually asked, and the follow-ups that came after it. The chain
-- is the point - "What is a HashMap?" earns "What happens on a collision?", which earns "Why did
-- Java 8 switch to a tree?" - so questions reference a parent rather than sitting in a flat list.
--
-- Answers are stored in three registers because an interview needs all three: what you say in
-- thirty seconds, what you say when they dig, and what the interviewer is actually checking for.
--
-- Expand only: three new tables, nothing existing changes.

CREATE TABLE interview_questions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key           VARCHAR(160) NOT NULL,
    subtopic_id   UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    parent_id     UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
    depth         INTEGER NOT NULL DEFAULT 1,
    order_index   INTEGER NOT NULL DEFAULT 1,
    prompt        TEXT NOT NULL,
    answer_short  TEXT NOT NULL,
    answer_deep   TEXT NOT NULL,
    answer_signal TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                  CONSTRAINT ck_interview_questions_status CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_interview_questions_key UNIQUE (key),
    -- Three levels is as deep as a real round goes; beyond that it is a different question.
    CONSTRAINT ck_interview_questions_depth CHECK (depth BETWEEN 1 AND 3),
    -- A question is either a root (no parent, depth 1) or a follow-up (a parent, deeper than 1).
    -- Without this an orphan could claim depth 3, or a child could claim to be a root.
    CONSTRAINT ck_interview_questions_root CHECK ((parent_id IS NULL) = (depth = 1))
);

COMMENT ON TABLE  interview_questions IS 'A question asked in a real interview, with its follow-ups.';
COMMENT ON COLUMN interview_questions.key IS 'Stable authoring key; an import upserts by it, so re-importing edits in place.';
COMMENT ON COLUMN interview_questions.parent_id IS 'The question this follows up on. NULL for the opening question.';
COMMENT ON COLUMN interview_questions.answer_short IS 'The thirty-second answer: what you say first.';
COMMENT ON COLUMN interview_questions.answer_deep IS 'The fuller answer, for when they dig.';
COMMENT ON COLUMN interview_questions.answer_signal IS 'What the interviewer is checking for by asking it.';

CREATE INDEX idx_interview_questions_subtopic ON interview_questions (subtopic_id);
CREATE INDEX idx_interview_questions_parent   ON interview_questions (parent_id);


CREATE TABLE interview_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company     VARCHAR(160) NOT NULL,
    role        VARCHAR(160),
    level       VARCHAR(80),
    round       VARCHAR(80),
    seen_month  DATE,
    source_url  VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  interview_reports IS 'A sighting: one occasion on which questions were reported as asked.';
COMMENT ON COLUMN interview_reports.seen_month IS 'Month it was asked, stored as the first of that month; the day is not known and not claimed.';
COMMENT ON COLUMN interview_reports.source_url IS 'Where it was read. Admin-only: no learner-facing DTO has a field for it, and none should.';


CREATE TABLE interview_question_reports (
    question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    report_id   UUID NOT NULL REFERENCES interview_reports(id)   ON DELETE CASCADE,
    PRIMARY KEY (question_id, report_id)
);

COMMENT ON TABLE interview_question_reports IS
    'Which questions a sighting covered. A question with no row here has never been confirmed asked, '
    'so it shows as Practice rather than claiming a provenance it does not have.';

-- The composite primary key indexes (question_id, ...); counting a report's questions needs the reverse.
CREATE INDEX idx_interview_question_reports_report ON interview_question_reports (report_id);
