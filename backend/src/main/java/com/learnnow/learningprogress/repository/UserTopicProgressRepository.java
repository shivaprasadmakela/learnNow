package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserTopicProgress;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserTopicProgressRepository extends JpaRepository<UserTopicProgress, UUID> {

    Optional<UserTopicProgress> findByUserIdAndTopicId(String userId, UUID topicId);

    List<UserTopicProgress> findByUserIdAndPathId(String userId, UUID pathId);

    List<UserTopicProgress> findByUserId(String userId);

    /** The learner's progress on some topics - the ones a list is about to show. */
    List<UserTopicProgress> findByUserIdAndTopicIdIn(String userId, Collection<UUID> topicIds);

    /**
     * The topics a learner touched most recently, most recently completed first and never-completed
     * ones last - the dashboard's recent-activity list, without loading the rest.
     */
    @Query(
            "SELECT utp FROM UserTopicProgress utp WHERE utp.userId = :userId"
                    + " ORDER BY utp.completedAt DESC NULLS LAST, utp.id ASC")
    List<UserTopicProgress> findRecentByUserId(@Param("userId") String userId, Limit limit);

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
