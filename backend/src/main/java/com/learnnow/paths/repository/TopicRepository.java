package com.learnnow.paths.repository;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Topic;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TopicRepository extends JpaRepository<Topic, UUID> {

    List<Topic> findByStatus(ContentStatus status);

    @Query(
            "SELECT pt.topic FROM PathTopic pt WHERE pt.path.id = :pathId AND (pt.topic.status ="
                    + " :status OR pt.path.status = :status) ORDER BY pt.orderIndex ASC")
    List<Topic> findByPathIdAndStatus(
            @Param("pathId") UUID pathId, @Param("status") ContentStatus status);

    @Query(
            "SELECT t FROM Topic t LEFT JOIN FETCH t.subtopics WHERE t.id = :id AND t.status ="
                    + " :status")
    Optional<Topic> findByIdAndStatusWithSubtopics(
            @Param("id") UUID id, @Param("status") ContentStatus status);

    /**
     * The paginated twin of {@link #findByPathIdAndStatus}. The count query is spelled out because
     * the projection selects {@code pt.topic} rather than the root entity, and Spring Data cannot
     * derive a count from that on its own.
     */
    @Query(
            value =
                    "SELECT pt.topic FROM PathTopic pt WHERE pt.path.id = :pathId AND"
                            + " (pt.topic.status = :status OR pt.path.status = :status) ORDER BY"
                            + " pt.orderIndex ASC",
            countQuery =
                    "SELECT COUNT(pt) FROM PathTopic pt WHERE pt.path.id = :pathId AND"
                            + " (pt.topic.status = :status OR pt.path.status = :status)")
    Page<Topic> findByPathIdAndStatus(
            @Param("pathId") UUID pathId, @Param("status") ContentStatus status, Pageable pageable);

    @Query("SELECT COUNT(st) FROM Subtopic st WHERE st.topic.id = :topicId")
    long countSubtopicsByTopicId(@Param("topicId") UUID topicId);

    @Query(
            "SELECT COUNT(pt) FROM PathTopic pt WHERE pt.path.id = :pathId AND pt.topic.status ="
                    + " 'PUBLISHED'")
    long countPublishedTopicsByPathId(@Param("pathId") UUID pathId);
}
