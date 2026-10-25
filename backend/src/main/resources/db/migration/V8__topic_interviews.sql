-- ============================================================================
-- Topic Interviews: spoken practice interviews on curriculum topics
-- ============================================================================
--
-- A learner completes a topic and can take a 5-minute AI practice interview.
-- Questions come from the topic's interview bank; an agent asks them by voice
-- through LiveKit, records turns, and an LLM scores the transcript against
-- expected key points.
--
-- All tables cascade from users or topics on deletion, so account erasure
-- and topic pruning clean them up automatically.

CREATE TABLE topic_interviews (
    id             UUID PRIMARY KEY,
    user_id        VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id       UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    status         VARCHAR(20) NOT NULL CONSTRAINT ck_topic_interviews_status
                   CHECK (status IN ('CREATED', 'COMPLETED', 'SCORED', 'FAILED', 'ABANDONED')),
    plan           JSONB NOT NULL,
    room           VARCHAR(80),
    overall_score  INTEGER CONSTRAINT ck_topic_interviews_score
                   CHECK (overall_score BETWEEN 0 AND 100),
    habits         JSONB,
    points_awarded INT NOT NULL DEFAULT 0,
    cost_inr       NUMERIC(8,2),
    ended_reason   VARCHAR(40),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at   TIMESTAMPTZ
);

CREATE INDEX topic_interviews_user ON topic_interviews (user_id, created_at DESC);
CREATE INDEX topic_interviews_topic ON topic_interviews (topic_id, user_id);

COMMENT ON TABLE topic_interviews IS
  'A learner practice interview on a completed topic, driven by voice.';
COMMENT ON COLUMN topic_interviews.plan IS
  'The interview plan: questions, wording, and follow-up chains chosen for this session.';
COMMENT ON COLUMN topic_interviews.habits IS
  'Speaking habits analytics (words per minute, filler words, pauses).';

CREATE TABLE topic_interview_turns (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id   UUID NOT NULL REFERENCES topic_interviews(id) ON DELETE CASCADE,
    seq            INTEGER NOT NULL,
    role           VARCHAR(20) NOT NULL,
    text           TEXT NOT NULL,
    at_seconds     NUMERIC(6,2) NOT NULL DEFAULT 0,
    question_id    UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX topic_interview_turns_interview ON topic_interview_turns (interview_id, seq);

COMMENT ON TABLE topic_interview_turns IS
  'Spoken dialogue turns in a topic interview session with timestamps.';

CREATE TABLE topic_interview_answers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id   UUID NOT NULL REFERENCES topic_interviews(id) ON DELETE CASCADE,
    question_id    UUID REFERENCES interview_questions(id) ON DELETE SET NULL,
    subtopic_id    UUID REFERENCES subtopics(id) ON DELETE SET NULL,
    prompt         TEXT NOT NULL,
    score          INTEGER CONSTRAINT ck_topic_interview_answers_score
                   CHECK (score BETWEEN 0 AND 10),
    good           TEXT,
    missing        TEXT,
    evidence       TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX topic_interview_answers_interview ON topic_interview_answers (interview_id);

COMMENT ON TABLE topic_interview_answers IS
  'Per-question feedback and score evaluated against the question bank.';
