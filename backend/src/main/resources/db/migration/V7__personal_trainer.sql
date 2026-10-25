-- ============================================================================
-- The AI personal trainer: a learner's goal, and the trainer's notes about them
-- ============================================================================
--
-- Everything else the trainer knows (progress, quiz results, streaks, study times) is already in
-- the learning tables and is read fresh for every conversation. These two tables hold only what
-- exists nowhere else: the goal the learner sets, and short notes the trainer draws from their
-- conversations.
--
-- Both cascade from users, so account erasure removes them with everything else (see
-- AccountErasureService).

CREATE TABLE learner_goals (
    user_id        VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    target_role    VARCHAR(120),
    target_date    DATE,
    hours_per_week SMALLINT CHECK (hours_per_week BETWEEN 1 AND 80),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE learner_goals IS
  'What the learner is working towards. Set by the learner; read by the AI trainer.';

CREATE TABLE trainer_notes (
    id         UUID PRIMARY KEY,
    user_id    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       VARCHAR(20)  NOT NULL CHECK (kind IN ('goal', 'gap', 'strength', 'preference')),
    text       VARCHAR(240) NOT NULL,
    source     VARCHAR(40)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX trainer_notes_user ON trainer_notes (user_id, created_at DESC);

COMMENT ON TABLE trainer_notes IS
  'Short facts the AI trainer drew from a conversation. The learner can see and delete each one.';
COMMENT ON COLUMN trainer_notes.source IS
  'Where the note came from, e.g. ask_ai. Interviews add their own sources later.';
