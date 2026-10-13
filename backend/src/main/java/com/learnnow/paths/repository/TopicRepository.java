package com.learnnow.paths.repository;

import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Topic;
import java.util.Collection;
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
            "SELECT pt.topic FROM PathTopic pt WHERE pt.path.id = :pathId AND pt.topic.status ="
                    + " :status AND pt.path.status = :status ORDER BY pt.orderIndex ASC")
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
                            + " pt.topic.status = :status AND pt.path.status = :status ORDER BY"
                            + " pt.orderIndex ASC",
            countQuery =
                    "SELECT COUNT(pt) FROM PathTopic pt WHERE pt.path.id = :pathId AND"
                            + " pt.topic.status = :status AND pt.path.status = :status")
    Page<Topic> findByPathIdAndStatus(
            @Param("pathId") UUID pathId, @Param("status") ContentStatus status, Pageable pageable);

    /**
     * Published subtopics only. Counting drafts would leave a topic forever short of complete,
     * since a learner cannot open - let alone finish - a lesson that is still in draft.
     */
    @Query(
            "SELECT COUNT(st) FROM Subtopic st WHERE st.topic.id = :topicId AND st.status ="
                    + " com.learnnow.paths.entity.ContentStatus.PUBLISHED")
    long countPublishedSubtopicsByTopicId(@Param("topicId") UUID topicId);

    @Query(
            "SELECT COUNT(pt) FROM PathTopic pt WHERE pt.path.id = :pathId AND pt.topic.status ="
                    + " 'PUBLISHED'")
    long countPublishedTopicsByPathId(@Param("pathId") UUID pathId);

    /** {@link #countPublishedTopicsByPathId} for a page of paths at once, as [pathId, count]. */
    @Query(
            "SELECT pt.path.id, COUNT(pt) FROM PathTopic pt WHERE pt.path.id IN :pathIds AND"
                    + " pt.topic.status = 'PUBLISHED' GROUP BY pt.path.id")
    List<Object[]> countPublishedTopicsByPathIds(@Param("pathIds") Collection<UUID> pathIds);
}
