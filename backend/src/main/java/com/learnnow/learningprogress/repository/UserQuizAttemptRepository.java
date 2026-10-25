package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserQuizAttempt;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserQuizAttemptRepository extends JpaRepository<UserQuizAttempt, UUID> {

    Optional<UserQuizAttempt> findByUserIdAndQuestionId(String userId, UUID questionId);

    /** A learner's attempts at some questions - which of a lesson's quiz they have answered. */
    List<UserQuizAttempt> findByUserIdAndQuestionIdIn(String userId, Collection<UUID> questionIds);

    /** Every attempt this learner has made. Used by the DPDP data export (s.11). */
    List<UserQuizAttempt> findByUserId(String userId);

    boolean existsByUserIdAndQuestionId(String userId, UUID questionId);

    /** One learner's quiz record per topic: how many questions answered, and how many correctly. */
    @Query(
            "SELECT t.id AS topicId, t.title AS topicTitle, COUNT(a) AS attempts,"
                    + " SUM(CASE WHEN a.correct = true THEN 1 ELSE 0 END) AS correct"
                    + " FROM UserQuizAttempt a, QuizQuestion q JOIN q.block b JOIN b.subtopic s"
                    + " JOIN s.topic t WHERE q.id = a.questionId AND a.userId = :userId"
                    + " GROUP BY t.id, t.title")
    List<TopicQuizRecord> quizRecordByTopic(@Param("userId") String userId);

    interface TopicQuizRecord {
        UUID getTopicId();

        String getTopicTitle();

        long getAttempts();

        long getCorrect();
    }
}
