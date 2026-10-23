-- ============================================================================
-- First-attempt-only scoring for the inline DSA check
-- ============================================================================
--
-- The "now your turn" question inside a statement awarded its points on every correct
-- submission, and the answer endpoint returned the correct option even for a wrong one - so one
-- wrong guess followed by a replayed correct request farmed points without limit. The subtopic
-- quiz had exactly this hole once and closed it with user_quiz_attempts; this is the same table
-- for checks.
--
-- Expand only: one new table, nothing existing changes.

CREATE TABLE user_dsa_check_attempts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        VARCHAR(255) NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    check_id       UUID NOT NULL REFERENCES dsa_checks(id) ON DELETE CASCADE,
    is_correct     BOOLEAN NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0
                   CONSTRAINT ck_dsa_check_attempt_points CHECK (points_awarded >= 0),
    attempted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- This constraint is the actual enforcement of first-attempt-only scoring. The service
    -- inserts with ON CONFLICT DO NOTHING, so two concurrent submissions cannot both count.
    CONSTRAINT uq_dsa_check_attempt_user_check UNIQUE (user_id, check_id)
);

COMMENT ON TABLE  user_dsa_check_attempts IS
  'One row per learner per inline check. Its existence is what stops points being farmed by replay.';
COMMENT ON COLUMN user_dsa_check_attempts.points_awarded IS
  'Non-zero only on a correct first attempt.';

-- The unique constraint indexes (user_id, ...); deleting a check needs the reverse.
CREATE INDEX idx_dsa_check_attempt_check ON user_dsa_check_attempts (check_id);
