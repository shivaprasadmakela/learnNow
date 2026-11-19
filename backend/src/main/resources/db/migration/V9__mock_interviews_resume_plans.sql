-- ============================================================================
-- The full trainer loop: mock interviews, resume review, weekly plans, switches
-- ============================================================================
--
-- Expand only: every existing row stays valid and every existing query keeps working.
--
-- topic_interviews now holds every voice interview, not just topic ones. A mock interview (built
-- from the learner's resume and target role) has no topic, and a retry asks one question from an
-- earlier interview again. The table keeps its name: renaming it would touch every query for no
-- gain to the learner.
--
-- Questions in a mock interview may be written by the AI rather than drawn from the bank, so an
-- answer row now carries the plan's own question id, its category and the model answer it was
-- scored against; question_id stays set only for bank questions.
--
-- The new learner tables cascade from users, so account erasure removes them with everything else
-- (see AccountErasureService).

ALTER TABLE topic_interviews ALTER COLUMN topic_id DROP NOT NULL;

ALTER TABLE topic_interviews
    ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'TOPIC'
        CONSTRAINT ck_topic_interviews_kind
        CHECK (kind IN ('TOPIC', 'RETRY', 'RESUME', 'HR', 'BEHAVIOURAL', 'PROJECT', 'FULL')),
    ADD COLUMN title VARCHAR(200),
    ADD COLUMN feedback JSONB,
    ADD COLUMN learner_rating SMALLINT
        CONSTRAINT ck_topic_interviews_rating CHECK (learner_rating IN (-1, 1)),
    ADD COLUMN learner_comment VARCHAR(500),
    ADD COLUMN parent_interview_id UUID REFERENCES topic_interviews(id) ON DELETE SET NULL;

-- The admin page lists the evaluations learners called unfair, newest first.
CREATE INDEX topic_interviews_flagged ON topic_interviews (created_at DESC)
    WHERE learner_rating = -1;

COMMENT ON COLUMN topic_interviews.kind IS
  'TOPIC (one completed topic), RETRY (one question again), or a mock interview: RESUME, HR,'
  ' BEHAVIOURAL, PROJECT or FULL.';
COMMENT ON COLUMN topic_interviews.title IS
  'What the interview was about, as the learner sees it: the topic title or the role.';
COMMENT ON COLUMN topic_interviews.feedback IS
  'The written debrief: dimensions (accuracy, depth, structure, communication), strengths,'
  ' improvements and next_step. Null for interviews scored before it existed.';
COMMENT ON COLUMN topic_interviews.learner_rating IS
  'The learner''s verdict on the evaluation: 1 fair, -1 unfair.';

ALTER TABLE topic_interview_answers
    ADD COLUMN plan_question_id UUID,
    ADD COLUMN category VARCHAR(20),
    ADD COLUMN model_answer TEXT;

COMMENT ON COLUMN topic_interview_answers.plan_question_id IS
  'The question''s id in the interview plan. Equals question_id for bank questions; AI-written'
  ' questions have only this.';

CREATE TABLE learner_resumes (
    user_id          VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    file_name        VARCHAR(255),
    resume_text      TEXT,
    profile          JSONB,
    review           JSONB,
    target_role      VARCHAR(120),
    job_description  TEXT,
    job_match        JSONB,
    analysis_month   VARCHAR(7)  NOT NULL,
    analysis_count   INT         NOT NULL DEFAULT 0,
    analysed_at      TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE learner_resumes IS
  'The text read from a learner''s resume and the AI''s review of it. The uploaded file itself is'
  ' never stored.';
COMMENT ON COLUMN learner_resumes.analysis_count IS
  'Analyses this analysis_month, for the monthly quota. Deleting the resume clears every other'
  ' column but keeps these two, so deleting and uploading again does not reset the quota.';

CREATE TABLE trainer_weekly_plans (
    id           UUID PRIMARY KEY,
    user_id      VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start   DATE         NOT NULL,
    plan         JSONB        NOT NULL,
    generations  INT          NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_trainer_weekly_plans_week UNIQUE (user_id, week_start)
);

COMMENT ON TABLE trainer_weekly_plans IS
  'The AI''s study plan for one learner''s week (Monday to Sunday in their time zone).';
COMMENT ON COLUMN trainer_weekly_plans.generations IS
  'How many times this week''s plan was written, for the weekly refresh limit.';

CREATE TABLE ai_feature_flags (
    feature     VARCHAR(40) PRIMARY KEY,
    enabled     BOOLEAN     NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- The admin who flipped it. SET NULL rather than CASCADE: erasing that admin's account must
    -- not switch a feature back on for everyone.
    updated_by  VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE ai_feature_flags IS
  'Admin switches for AI features. No row means the feature is on.';
