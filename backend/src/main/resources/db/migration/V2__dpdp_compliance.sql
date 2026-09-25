-- ============================================================================
-- V2 — Digital Personal Data Protection Act, 2023
--
-- The Act gives a Data Principal — the learner — rights that a schema has to be
-- able to answer, not just a privacy page that claims them. Three of the four
-- need storage:
--
--   * s.6   Consent must be free, specific, informed and unambiguous, and
--           withdrawing it must be as easy as giving it. The Fiduciary has to
--           be able to *demonstrate* that consent was given, which means
--           keeping the decision, its time, and which notice it was given
--           against.
--   * s.13  Grievance redressal. A learner must be able to raise a complaint
--           and see what happened to it, before they escalate to the Board.
--   * s.14  Right to nominate. Someone the learner names may exercise these
--           rights if the learner dies or is incapacitated.
--
-- The remaining two need no tables. s.11 (access) is a read across what is
-- already here, and s.12 (correction and erasure) is served by the cascades V1
-- already declares: deleting a users row takes its progress, notes, bookmarks,
-- submissions and tokens with it in one statement.
--
-- One deliberate exception to that cascade, spelled out here because it is the
-- kind of thing that looks like a bug later: donation_orders is NOT linked to
-- users and is not erased. Payment records are retained under tax and audit
-- law, which s.8(7) explicitly preserves — the duty to erase yields to another
-- law requiring retention. The donor's name and email on those rows are
-- overwritten at erasure instead, so the financial record survives without
-- staying personally identifying. That happens in the erasure service, not
-- here.
--
-- Conventions follow V1's header: UUID surrogate keys, TIMESTAMPTZ never
-- TIMESTAMP, an index on every foreign key, CHECK constraints instead of free
-- text, COMMENT on anything non-obvious, and cascade from the owning row.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION 1 — Consent
--
-- Two tables, because the question "may we email this learner today?" and the
-- question "prove they agreed on the 4th of March" want different shapes.
-- user_consents answers the first in one indexed read. user_consent_events is
-- append-only and answers the second, including for consent since withdrawn,
-- which by definition no longer exists in the first table's state.
--
-- Collapsing them into one append-only table and taking the latest row per
-- purpose was the alternative. It was rejected because every permission check
-- on a hot path would become a window function over the learner's whole
-- consent history, to answer a question that is one boolean.
-- ----------------------------------------------------------------------------

CREATE TABLE user_consents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Open-ended on purpose is wrong here: a typo in a purpose name would read
    -- as "no consent" and silently suppress a legitimate email, or worse, read
    -- as a purpose nobody ever consented to. The set is small and changes only
    -- with a new notice, so it is constrained.
    purpose       VARCHAR(32) NOT NULL
                  CONSTRAINT ck_user_consents_purpose
                  CHECK (purpose IN ('ESSENTIAL', 'PRODUCT_ANALYTICS',
                                     'MARKETING_EMAILS', 'PERSONALISATION')),
    granted       BOOLEAN NOT NULL,
    -- Which version of the privacy notice was on screen when they decided.
    -- Without it, "they consented" is unfalsifiable: we would not know what
    -- they were told they were consenting to.
    notice_version VARCHAR(16) NOT NULL,
    decided_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Surrogate key with the natural key as a UNIQUE constraint, following the
    -- shape V1 uses for the other per-user-per-thing tables. One decision per
    -- learner per purpose; a second write updates it rather than accumulating.
    CONSTRAINT uq_user_consents_user_purpose UNIQUE (user_id, purpose)
);

COMMENT ON TABLE  user_consents IS
  'Current consent state, one row per learner per purpose. The answer to "may we do X".';
COMMENT ON COLUMN user_consents.purpose IS
  'ESSENTIAL covers running the account itself and is not withdrawable while the account exists; '
  'withdrawing it means deleting the account, which is offered separately. The other three are '
  'freely withdrawable.';
COMMENT ON COLUMN user_consents.notice_version IS
  'Version of the privacy notice shown at the time, so what was agreed to can be reconstructed.';

CREATE INDEX idx_user_consents_user ON user_consents (user_id);


CREATE TABLE user_consent_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose        VARCHAR(32) NOT NULL
                   CONSTRAINT ck_user_consent_events_purpose
                   CHECK (purpose IN ('ESSENTIAL', 'PRODUCT_ANALYTICS',
                                      'MARKETING_EMAILS', 'PERSONALISATION')),
    granted        BOOLEAN NOT NULL,
    notice_version VARCHAR(16) NOT NULL,
    -- How the decision reached us. SIGNUP_NOTICE and GOOGLE_SIGNUP are kept apart
    -- because the form takes an explicit tick against the notice and the Google
    -- button does not -- collapsing them would have this table claim a
    -- confirmation that was never given. There is no value for account deletion:
    -- these rows cascade with the user, so an event recorded while erasing an
    -- account would be deleted by the same transaction that wrote it.
    source         VARCHAR(24) NOT NULL
                   CONSTRAINT ck_user_consent_events_source
                   CHECK (source IN ('SIGNUP_NOTICE', 'GOOGLE_SIGNUP', 'CONSENT_CENTRE')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_consent_events IS
  'Append-only ledger of every consent decision. Never updated and never deleted except with the '
  'account: it exists to demonstrate consent under s.6, which an overwritable row cannot do.';

CREATE INDEX idx_user_consent_events_user ON user_consent_events (user_id, created_at DESC);


-- ----------------------------------------------------------------------------
-- SECTION 2 — Nominee (s.14)
--
-- One nominee per learner, so the user_id is the key. The Act does not cap the
-- number, but a single nominee keeps the question "who may act for this
-- learner" answerable without a precedence rule nobody would ever specify.
-- ----------------------------------------------------------------------------

CREATE TABLE user_nominees (
    user_id      VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    -- Free text: "spouse", "son", "friend" - an enum here would be both
    -- presumptuous about families and a migration every time it is wrong.
    relationship VARCHAR(64),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_nominees IS
  'The person a learner names to exercise their rights if they die or are incapacitated (s.14).';
COMMENT ON COLUMN user_nominees.email IS
  'How the nominee is identified when they come forward. Not verified at nomination time - the '
  'learner is naming someone, not creating them an account.';


-- ----------------------------------------------------------------------------
-- SECTION 3 — Grievances (s.13)
--
-- A learner must have a way to complain to us, and to see that it went
-- somewhere. Escalation to the Data Protection Board is only open to them
-- after they have exhausted this, so a grievance that vanishes is not a minor
-- UX failure.
-- ----------------------------------------------------------------------------

CREATE TABLE grievances (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Short, human-readable, and quotable over email or a phone call. The UUID
    -- is the key; this is what a person actually refers to.
    reference   VARCHAR(20) NOT NULL UNIQUE,
    user_id     VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category    VARCHAR(32) NOT NULL
                CONSTRAINT ck_grievances_category
                CHECK (category IN ('DATA_ACCESS', 'DATA_CORRECTION', 'DATA_ERASURE',
                                    'CONSENT', 'SECURITY', 'OTHER')),
    subject     VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    status      VARCHAR(16) NOT NULL DEFAULT 'OPEN'
                CONSTRAINT ck_grievances_status
                CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    -- What we told them. Shown verbatim to the learner, so it is written as a
    -- reply rather than as an internal note.
    response    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE  grievances IS
  'Learner complaints about their personal data, and what we did about them (s.13).';
COMMENT ON COLUMN grievances.reference IS
  'Human-quotable ticket id, e.g. GRV-2026-0007. Unique; the UUID stays the primary key.';
COMMENT ON COLUMN grievances.resolved_at IS
  'Set when status first reaches RESOLVED or CLOSED. Drives any redressal-time reporting.';

CREATE INDEX idx_grievances_user   ON grievances (user_id, created_at DESC);
CREATE INDEX idx_grievances_status ON grievances (status) WHERE status IN ('OPEN', 'IN_PROGRESS');


-- ----------------------------------------------------------------------------
-- SECTION 4 — updated_at triggers
-- ----------------------------------------------------------------------------

CREATE TRIGGER trg_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_nominees_updated_at
    BEFORE UPDATE ON user_nominees
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_grievances_updated_at
    BEFORE UPDATE ON grievances
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
