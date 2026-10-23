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

    /** What a list row shows of a topic, without its lessons. */
    interface TopicHeader {
        UUID getId();

        String getTitle();

        String getDescription();

        ContentStatus getStatus();
    }

    /** Headers of some topics, whatever their status; the caller decides what a draft means. */
    List<TopicHeader> findHeadersByIdIn(Collection<UUID> ids);

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

    /**
     * {@link #countPublishedSubtopicsByTopicId} for several topics at once, as [topicId, lessons].
     * A topic with no published lesson has no row.
     */
    @Query(
            "SELECT st.topic.id, COUNT(st) FROM Subtopic st WHERE st.topic.id IN :topicIds AND"
                    + " st.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " GROUP BY st.topic.id")
    List<Object[]> countPublishedLessonsByTopicIds(@Param("topicIds") Collection<UUID> topicIds);

    @Query(
            "SELECT COUNT(pt) FROM PathTopic pt WHERE pt.path.id = :pathId AND pt.topic.status ="
                    + " 'PUBLISHED'")
    long countPublishedTopicsByPathId(@Param("pathId") UUID pathId);

    /** {@link #countPublishedTopicsByPathId} for a page of paths at once, as [pathId, count]. */
    @Query(
            "SELECT pt.path.id, COUNT(pt) FROM PathTopic pt WHERE pt.path.id IN :pathIds AND"
                    + " pt.topic.status = 'PUBLISHED' GROUP BY pt.path.id")
    List<Object[]> countPublishedTopicsByPathIds(@Param("pathIds") Collection<UUID> pathIds);

    /**
     * Estimated minutes to finish each path, as [pathId, minutes]: the authored estimates of its
     * published lessons in published topics. A path with no such lesson has no row.
     */
    @Query(
            "SELECT pt.path.id, SUM(st.estimatedMinutes) FROM PathTopic pt, Subtopic st WHERE"
                + " st.topic = pt.topic AND pt.path.id IN :pathIds AND pt.topic.status ="
                + " 'PUBLISHED' AND st.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                + " GROUP BY pt.path.id")
    List<Object[]> sumPublishedMinutesByPathIds(@Param("pathIds") Collection<UUID> pathIds);

    /**
     * Published lessons in each published topic of some paths, as [pathId, topicId, lessons]. A
     * published topic with no published lesson still has a row, with a count of zero, because it
     * still counts towards its path's average.
     */
    @Query(
            "SELECT pt.path.id, pt.topic.id, COUNT(st) FROM PathTopic pt LEFT JOIN Subtopic st ON"
                + " st.topic = pt.topic AND st.status ="
                + " com.learnnow.paths.entity.ContentStatus.PUBLISHED WHERE pt.path.id IN :pathIds"
                + " AND pt.topic.status = 'PUBLISHED' GROUP BY pt.path.id, pt.topic.id")
    List<Object[]> countPublishedLessonsByTopicForPathIds(
            @Param("pathIds") Collection<UUID> pathIds);

    /**
     * A path's published lessons in the order a learner meets them - topic order within the path,
     * then lesson order within the topic - as [topicId, topicTitle, subtopicId, subtopicTitle].
     */
    @Query(
            "SELECT pt.topic.id, pt.topic.title, st.id, st.title FROM PathTopic pt JOIN Subtopic st"
                + " ON st.topic = pt.topic WHERE pt.path.id = :pathId AND pt.topic.status ="
                + " 'PUBLISHED' AND st.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                + " ORDER BY pt.orderIndex ASC, st.orderIndex ASC")
    List<Object[]> findPublishedLessonsInOrder(@Param("pathId") UUID pathId);
}
