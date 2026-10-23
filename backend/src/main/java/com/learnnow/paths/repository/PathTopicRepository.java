package com.learnnow.paths.repository;

import com.learnnow.paths.entity.PathTopic;
import com.learnnow.paths.entity.PathTopicId;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PathTopicRepository extends JpaRepository<PathTopic, PathTopicId> {

    List<PathTopic> findByPathIdOrderByOrderIndexAsc(UUID pathId);

    List<PathTopic> findByTopicId(UUID topicId);

    void deleteByIdPathIdAndIdTopicId(UUID pathId, UUID topicId);

    boolean existsByIdPathIdAndIdTopicId(UUID pathId, UUID topicId);

    /**
     * Resolves the path a topic belongs to via the join table.
     *
     * <p>This is the single source of truth. {@code topics.path_id} is a legacy column that the
     * admin attach flow never populated, so {@code topic.getPath()} was null for anything attached
     * through the UI and dereferencing it threw.
     */
    @Query(
            "SELECT pt.path.id FROM PathTopic pt WHERE pt.topic.id = :topicId"
                    + " ORDER BY pt.orderIndex ASC LIMIT 1")
    Optional<UUID> findPrimaryPathIdByTopicId(@Param("topicId") UUID topicId);

    /** One published path a topic belongs to. */
    interface TopicPath {
        UUID getTopicId();

        UUID getPathId();

        String getPathTitle();
    }

    /**
     * The published paths each of some topics belongs to, in the same order as {@link
     * #findPrimaryPathIdByTopicId} - so the first row for a topic is its primary path.
     */
    @Query(
            "SELECT pt.topic.id AS topicId, pt.path.id AS pathId, pt.path.title AS pathTitle"
                    + " FROM PathTopic pt WHERE pt.topic.id IN :topicIds AND pt.path.status ="
                    + " com.learnnow.paths.entity.ContentStatus.PUBLISHED"
                    + " ORDER BY pt.orderIndex ASC")
    List<TopicPath> findPublishedPathsOfTopics(@Param("topicIds") Collection<UUID> topicIds);
}
