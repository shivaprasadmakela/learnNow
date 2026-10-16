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
