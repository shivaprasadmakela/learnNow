-- V2: Add missing foreign key indexes for JOIN FETCH and ON DELETE CASCADE performance
-- Without these indexes, every cascade delete and JOIN query does sequential table scans

CREATE INDEX IF NOT EXISTS idx_topics_path_id ON topics(path_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_subtopic_id ON content_blocks(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_block_id ON quiz_questions(block_id);
