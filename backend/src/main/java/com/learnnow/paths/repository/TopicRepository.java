package com.learnnow.paths.repository;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {

    List<Topic> findByStatus(ContentStatus status);

    @Query("SELECT t FROM Topic t LEFT JOIN FETCH t.subtopics WHERE t.id = :id AND t.status = :status")
    Optional<Topic> findByIdAndStatusWithSubtopics(@Param("id") UUID id, @Param("status") ContentStatus status);

    @Query("SELECT COUNT(st) FROM Subtopic st WHERE st.topic.id = :topicId")
    long countSubtopicsByTopicId(@Param("topicId") UUID topicId);

    @Query("SELECT COUNT(t) FROM Topic t WHERE t.path.id = :pathId AND t.status = 'PUBLISHED'")
    long countPublishedTopicsByPathId(@Param("pathId") UUID pathId);
}
