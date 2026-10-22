package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserTopicProgress;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserTopicProgressRepository extends JpaRepository<UserTopicProgress, UUID> {

    Optional<UserTopicProgress> findByUserIdAndTopicId(String userId, UUID topicId);

    List<UserTopicProgress> findByUserIdAndPathId(String userId, UUID pathId);

    List<UserTopicProgress> findByUserId(String userId);

    /** The topic a learner marked complete most recently. */
    Optional<UserTopicProgress> findFirstByUserIdAndCompletedAtNotNullOrderByCompletedAtDesc(
            String userId);

    @Query(
            "SELECT COUNT(utp) FROM UserTopicProgress utp WHERE utp.userId = :userId AND utp.pathId"
                    + " = :pathId AND utp.status = 'COMPLETED'")
    long countCompletedByUserIdAndPathId(
            @Param("userId") String userId, @Param("pathId") UUID pathId);

    /** Which of the given topics a learner has marked complete as a whole. */
    @Query(
            "SELECT utp.topicId FROM UserTopicProgress utp WHERE utp.userId = :userId AND"
                    + " utp.status = 'COMPLETED' AND utp.topicId IN :topicIds")
    List<UUID> findCompletedTopicIds(
            @Param("userId") String userId, @Param("topicIds") Collection<UUID> topicIds);
}
