-- V3: Add performance indexes for frequently-queried user progress columns
-- These supplement the existing unique constraints to optimize lookup patterns

-- user_subtopic_progress: optimize countByUserIdAndTopicIdAndCompletedTrue
CREATE INDEX IF NOT EXISTS idx_usp_user_topic_completed ON user_subtopic_progress(user_id, topic_id, completed);

-- user_topic_progress: optimize countCompletedByUserIdAndPathId
CREATE INDEX IF NOT EXISTS idx_utp_user_path_status ON user_topic_progress(user_id, path_id, status);

-- subtopics: optimize countSubtopicsByTopicId
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_count ON subtopics(topic_id);

-- topics: optimize countPublishedTopicsByPathId
CREATE INDEX IF NOT EXISTS idx_topics_path_status ON topics(path_id, status);
