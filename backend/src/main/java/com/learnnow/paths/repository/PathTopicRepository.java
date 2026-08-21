package com.learnnow.paths.repository;

import com.learnnow.paths.entity.PathTopic;
import com.learnnow.paths.entity.PathTopicId;
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
}
