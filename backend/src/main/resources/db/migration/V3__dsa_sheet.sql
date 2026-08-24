-- ============================================================================
-- V3 — DSA sheet
--
-- A structured problem sheet as a module of its own, a sibling of the course
-- catalogue rather than a special case of it: nothing here references paths,
-- topics or subtopics.
--
-- Four levels of content spine (sheet -> step -> section -> problem), four
-- tables of per-problem depth, and three per-learner tables. The two that make
-- the coding workspace possible are dsa_harnesses and dsa_test_cases; the rest
-- would be recognisable to anyone who has seen the course tables.
--
-- Conventions follow V1's header: UUID surrogate keys, TIMESTAMPTZ never
-- TIMESTAMP, an index on every foreign key, CHECK constraints instead of free
-- text, COMMENT on anything non-obvious, and cascade from the owning row.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION 1 — Content spine
-- ----------------------------------------------------------------------------

CREATE TABLE dsa_sheets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         VARCHAR(120) NOT NULL UNIQUE,
    title        VARCHAR(255) NOT NULL,
    description  VARCHAR(1000),
    playlist_url VARCHAR(512),
    status       VARCHAR(16) NOT NULL DEFAULT 'DRAFT'
                 CONSTRAINT ck_dsa_sheets_status CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  dsa_sheets IS 'A problem sheet. More than one is allowed by design; one ships.';
COMMENT ON COLUMN dsa_sheets.playlist_url IS 'YouTube playlist backing the sheet. Problems deep-link into it by position.';

CREATE INDEX idx_dsa_sheets_status ON dsa_sheets (status);


CREATE TABLE dsa_steps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id    UUID NOT NULL REFERENCES dsa_sheets(id) ON DELETE CASCADE,
    slug        VARCHAR(120) NOT NULL,
    order_index INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_steps_sheet_slug  UNIQUE (sheet_id, slug),
    CONSTRAINT uq_dsa_steps_sheet_order UNIQUE (sheet_id, order_index)
);

COMMENT ON COLUMN dsa_steps.slug IS 'Stable URL segment. Unique per sheet, so /dsa/:stepSlug/:problemSlug never shifts.';

CREATE INDEX idx_dsa_steps_sheet ON dsa_steps (sheet_id, order_index);


CREATE TABLE dsa_sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id     UUID NOT NULL REFERENCES dsa_steps(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    title       VARCHAR(255),
    description VARCHAR(1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_sections_step_order UNIQUE (step_id, order_index)
);

COMMENT ON TABLE  dsa_sections IS 'Optional grouping inside a step. A step with one untitled section renders flat.';
COMMENT ON COLUMN dsa_sections.title IS 'Nullable on purpose: the single implicit section of a flat step has no heading.';

CREATE INDEX idx_dsa_sections_step ON dsa_sections (step_id, order_index);


CREATE TABLE dsa_problems (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id        UUID NOT NULL REFERENCES dsa_sections(id) ON DELETE CASCADE,
    slug              VARCHAR(160) NOT NULL UNIQUE,
    order_index       INT NOT NULL,
    title             VARCHAR(255) NOT NULL,
    statement         TEXT NOT NULL DEFAULT '',
    difficulty        VARCHAR(8) NOT NULL
                      CONSTRAINT ck_dsa_problems_difficulty
                      CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    tags              JSONB NOT NULL DEFAULT '[]',
    estimated_minutes INT NOT NULL DEFAULT 20,
    youtube_url       VARCHAR(512),
    youtube_position  INT,
    practice_url      VARCHAR(512),
    practice_platform VARCHAR(32),
    status            VARCHAR(16) NOT NULL DEFAULT 'DRAFT'
                      CONSTRAINT ck_dsa_problems_status CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_problems_section_order UNIQUE (section_id, order_index)
);

COMMENT ON COLUMN dsa_problems.slug IS
  'Stable import key. Re-importing a step matches on this and updates in place -- never '
  'delete-and-recreate, or every learner loses their progress and submissions.';
COMMENT ON COLUMN dsa_problems.statement IS
  'Markdown, written by us. Third-party problem statements are not ours to copy.';
COMMENT ON COLUMN dsa_problems.youtube_position IS
  'One-based index in the sheet playlist, for the "watch on the channel" deep link.';

CREATE INDEX idx_dsa_problems_section ON dsa_problems (section_id, order_index);
CREATE INDEX idx_dsa_problems_status  ON dsa_problems (status);


-- ----------------------------------------------------------------------------
-- SECTION 2 — Per-problem editorial depth
-- ----------------------------------------------------------------------------

CREATE TABLE dsa_approaches (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id       UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    kind             VARCHAR(8) NOT NULL
                     CONSTRAINT ck_dsa_approaches_kind
                     CHECK (kind IN ('BRUTE', 'BETTER', 'OPTIMAL')),
    order_index      INT NOT NULL,
    intuition        TEXT NOT NULL DEFAULT '',
    time_complexity  VARCHAR(64),
    space_complexity VARCHAR(64),
    language         VARCHAR(24),
    code             TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_approaches_problem_order UNIQUE (problem_id, order_index)
);

COMMENT ON TABLE dsa_approaches IS
  'Our editorial. The UI reveals these in order, so a learner walks past brute force '
  'before optimal appears.';

CREATE INDEX idx_dsa_approaches_problem ON dsa_approaches (problem_id, order_index);


CREATE TABLE dsa_hints (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id  UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_hints_problem_order UNIQUE (problem_id, order_index)
);

COMMENT ON TABLE dsa_hints IS 'Progressive hints, revealed one at a time rather than paywalled.';

CREATE INDEX idx_dsa_hints_problem ON dsa_hints (problem_id, order_index);


CREATE TABLE dsa_harnesses (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id         UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    language           VARCHAR(24) NOT NULL,
    starter_code       TEXT NOT NULL,
    driver_code        TEXT NOT NULL,
    reference_solution TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_harnesses_problem_lang UNIQUE (problem_id, language),
    CONSTRAINT ck_dsa_harnesses_placeholder
        CHECK (position('{{USER_CODE}}' in driver_code) > 0)
);

COMMENT ON TABLE  dsa_harnesses IS
  'What turns a fragment into a program. One row per problem per language.';
COMMENT ON COLUMN dsa_harnesses.starter_code IS
  'The stub the editor shows. The only column of this table a learner ever sees.';
COMMENT ON COLUMN dsa_harnesses.driver_code IS
  'Full compilable program with {{USER_CODE}} where the learner''s class is spliced in. '
  'Reads a case count from stdin, loops, prints a delimiter after each case. NEVER '
  'serialised to a non-admin client -- it embeds the I/O contract and often the answer shape.';
COMMENT ON COLUMN dsa_harnesses.reference_solution IS
  'Our own working solution. Drives the generate-expected-output action. Never serialised '
  'to a non-admin client.';

CREATE INDEX idx_dsa_harnesses_problem ON dsa_harnesses (problem_id);


CREATE TABLE dsa_test_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id      UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    order_index     INT NOT NULL,
    input           TEXT NOT NULL,
    expected_output TEXT NOT NULL DEFAULT '',
    is_sample       BOOLEAN NOT NULL DEFAULT FALSE,
    explanation     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_test_cases_problem_order UNIQUE (problem_id, order_index)
);

COMMENT ON COLUMN dsa_test_cases.is_sample IS
  'Sample cases are public: they render as the Examples in the statement and are the only '
  'ones Run executes. Non-sample rows and their expected output are admin-only.';
COMMENT ON COLUMN dsa_test_cases.expected_output IS
  'Defaults to empty so a case can be imported before the reference solution has generated it.';

CREATE INDEX idx_dsa_test_cases_problem ON dsa_test_cases (problem_id, order_index);


CREATE TABLE dsa_checks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id     UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    order_index    INT NOT NULL DEFAULT 1,
    prompt         TEXT NOT NULL,
    options        JSONB NOT NULL DEFAULT '[]',
    correct_answer VARCHAR(512) NOT NULL,
    explanation    TEXT,
    points         INT NOT NULL DEFAULT 2,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dsa_checks_problem_order UNIQUE (problem_id, order_index)
);

COMMENT ON TABLE  dsa_checks IS
  'The inline "now your turn" question inside a statement. Answered against the server.';
COMMENT ON COLUMN dsa_checks.correct_answer IS
  'Stripped from every learner-facing response and compared server-side, the same rule the '
  'subtopic quiz already follows.';

CREATE INDEX idx_dsa_checks_problem ON dsa_checks (problem_id, order_index);


-- ----------------------------------------------------------------------------
-- SECTION 3 — Per-learner data
-- ----------------------------------------------------------------------------

CREATE TABLE user_dsa_problem_progress (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id          UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    status              VARCHAR(16) NOT NULL DEFAULT 'NOT_STARTED'
                        CONSTRAINT ck_user_dsa_progress_status
                        CHECK (status IN ('NOT_STARTED', 'ATTEMPTED', 'SOLVED')),
    marked_for_revision BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count       INT NOT NULL DEFAULT 0,
    last_language       VARCHAR(24),
    solved_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_dsa_progress UNIQUE (user_id, problem_id)
);

COMMENT ON COLUMN user_dsa_problem_progress.solved_at IS
  'Also the once-ever points guard: points are awarded only on the transition from null.';

CREATE INDEX idx_user_dsa_progress_user     ON user_dsa_problem_progress (user_id);
CREATE INDEX idx_user_dsa_progress_problem  ON user_dsa_problem_progress (problem_id);
CREATE INDEX idx_user_dsa_progress_revision ON user_dsa_problem_progress (user_id)
    WHERE marked_for_revision;


CREATE TABLE user_dsa_problem_notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    content    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_dsa_notes UNIQUE (user_id, problem_id)
);

COMMENT ON TABLE  user_dsa_problem_notes IS 'Private per-problem notes. Visible only to their author.';
COMMENT ON COLUMN user_dsa_problem_notes.content IS 'Markdown. Rendered through an escaping renderer, never as raw HTML.';

CREATE INDEX idx_user_dsa_notes_user    ON user_dsa_problem_notes (user_id);
CREATE INDEX idx_user_dsa_notes_problem ON user_dsa_problem_notes (problem_id);


CREATE TABLE user_dsa_submissions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id   UUID NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    language     VARCHAR(24) NOT NULL,
    code         TEXT NOT NULL,
    verdict      VARCHAR(16) NOT NULL
                 CONSTRAINT ck_user_dsa_submissions_verdict
                 CHECK (verdict IN ('ACCEPTED', 'WRONG_ANSWER', 'COMPILE_ERROR',
                                    'RUNTIME_ERROR', 'TIME_LIMIT', 'ENGINE_ERROR')),
    passed_count INT NOT NULL DEFAULT 0,
    total_count  INT NOT NULL DEFAULT 0,
    runtime_ms   INT,
    memory_kb    BIGINT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_dsa_submissions IS
  'Every Submit, pass or fail. ENGINE_ERROR rows are recorded for diagnostics but never '
  'count as an attempt against the learner.';

CREATE INDEX idx_user_dsa_submissions_user_problem
    ON user_dsa_submissions (user_id, problem_id, created_at DESC);


-- ----------------------------------------------------------------------------
-- SECTION 4 — updated_at triggers
-- ----------------------------------------------------------------------------

CREATE TRIGGER trg_dsa_sheets_updated_at        BEFORE UPDATE ON dsa_sheets                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dsa_steps_updated_at         BEFORE UPDATE ON dsa_steps                 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dsa_sections_updated_at      BEFORE UPDATE ON dsa_sections              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dsa_problems_updated_at      BEFORE UPDATE ON dsa_problems              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dsa_approaches_updated_at    BEFORE UPDATE ON dsa_approaches            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dsa_harnesses_updated_at     BEFORE UPDATE ON dsa_harnesses             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dsa_test_cases_updated_at    BEFORE UPDATE ON dsa_test_cases            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dsa_checks_updated_at        BEFORE UPDATE ON dsa_checks                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_dsa_progress_updated_at BEFORE UPDATE ON user_dsa_problem_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_dsa_notes_updated_at    BEFORE UPDATE ON user_dsa_problem_notes    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
