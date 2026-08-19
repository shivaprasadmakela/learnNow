package com.learnnow.paths.repository;

import com.learnnow.paths.entity.PathTopic;
import com.learnnow.paths.entity.PathTopicId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PathTopicRepository extends JpaRepository<PathTopic, PathTopicId> {

    List<PathTopic> findByPathIdOrderByOrderIndexAsc(UUID pathId);

    List<PathTopic> findByTopicId(UUID topicId);

    void deleteByIdPathIdAndIdTopicId(UUID pathId, UUID topicId);

    boolean existsByIdPathIdAndIdTopicId(UUID pathId, UUID topicId);
}
