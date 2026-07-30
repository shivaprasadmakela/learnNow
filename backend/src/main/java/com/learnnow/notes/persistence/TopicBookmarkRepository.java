package com.learnnow.notes.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicBookmarkRepository extends JpaRepository<TopicBookmark, UUID> {
    List<TopicBookmark> findAllByUserId(String userId);
    Optional<TopicBookmark> findByUserIdAndTopicId(String userId, UUID topicId);
    boolean existsByUserIdAndTopicId(String userId, UUID topicId);
    void deleteByUserIdAndTopicId(String userId, UUID topicId);
}
