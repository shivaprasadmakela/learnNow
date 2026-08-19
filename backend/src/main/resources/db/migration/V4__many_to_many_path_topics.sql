-- V4__many_to_many_path_topics.sql
-- Create join table to support Many-to-Many relationships between Paths and Topics with path-specific ordering

CREATE TABLE IF NOT EXISTS path_topics (
    path_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (path_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_path_topics_topic ON path_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_path_topics_order ON path_topics(path_id, order_index);

-- Migrate existing topic-path associations into path_topics
INSERT INTO path_topics (path_id, topic_id, order_index)
SELECT path_id, id, COALESCE(order_index, 1)
FROM topics
WHERE path_id IS NOT NULL
ON CONFLICT (path_id, topic_id) DO NOTHING;
