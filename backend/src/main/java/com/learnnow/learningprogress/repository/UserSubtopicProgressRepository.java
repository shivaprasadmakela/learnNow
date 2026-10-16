package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSubtopicProgressRepository extends JpaRepository<UserSubtopicProgress, UUID> {

    Optional<UserSubtopicProgress> findByUserIdAndSubtopicId(String userId, UUID subtopicId);

    List<UserSubtopicProgress> findByUserIdAndTopicId(String userId, UUID topicId);

    List<UserSubtopicProgress> findByUserId(String userId);

    long countByUserIdAndTopicIdAndCompletedTrue(String userId, UUID topicId);

    /**
     * How many published lessons of each topic a learner has completed, as [topicId, count]. A
     * completed lesson since moved back to draft no longer counts, matching what the learner can
     * see.
     */
    @Query(
            "SELECT st.topic.id, COUNT(usp) FROM UserSubtopicProgress usp, Subtopic st WHERE st.id"
                + " = usp.subtopicId AND usp.userId = :userId AND usp.completed = true AND"
                + " st.status = com.learnnow.paths.entity.ContentStatus.PUBLISHED AND st.topic.id"
                + " IN :topicIds GROUP BY st.topic.id")
    List<Object[]> countCompletedPublishedLessonsByTopic(
            @Param("userId") String userId, @Param("topicIds") Collection<UUID> topicIds);

    /** Which of the given lessons a learner has completed. */
    @Query(
            "SELECT usp.subtopicId FROM UserSubtopicProgress usp WHERE usp.userId = :userId AND"
                    + " usp.completed = true AND usp.subtopicId IN :subtopicIds")
    List<UUID> findCompletedSubtopicIds(
            @Param("userId") String userId, @Param("subtopicIds") Collection<UUID> subtopicIds);
}
