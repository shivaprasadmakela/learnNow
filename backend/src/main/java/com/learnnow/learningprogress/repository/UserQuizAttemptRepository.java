package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserQuizAttempt;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserQuizAttemptRepository extends JpaRepository<UserQuizAttempt, UUID> {

    Optional<UserQuizAttempt> findByUserIdAndQuestionId(String userId, UUID questionId);

    /** A learner's attempts at some questions - which of a lesson's quiz they have answered. */
    List<UserQuizAttempt> findByUserIdAndQuestionIdIn(String userId, Collection<UUID> questionIds);

    /** Every attempt this learner has made. Used by the DPDP data export (s.11). */
    List<UserQuizAttempt> findByUserId(String userId);

    boolean existsByUserIdAndQuestionId(String userId, UUID questionId);
}
