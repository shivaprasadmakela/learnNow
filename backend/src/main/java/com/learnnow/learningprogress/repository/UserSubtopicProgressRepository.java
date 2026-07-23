package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSubtopicProgressRepository extends JpaRepository<UserSubtopicProgress, UUID> {

    Optional<UserSubtopicProgress> findByUserIdAndSubtopicId(String userId, UUID subtopicId);

    List<UserSubtopicProgress> findByUserIdAndTopicId(String userId, UUID topicId);

    List<UserSubtopicProgress> findByUserId(String userId);

    long countByUserIdAndTopicIdAndCompletedTrue(String userId, UUID topicId);
}
