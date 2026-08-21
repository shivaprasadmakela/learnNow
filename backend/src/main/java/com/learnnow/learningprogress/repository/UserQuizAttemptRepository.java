package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserQuizAttempt;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserQuizAttemptRepository extends JpaRepository<UserQuizAttempt, UUID> {

    Optional<UserQuizAttempt> findByUserIdAndQuestionId(String userId, UUID questionId);

    boolean existsByUserIdAndQuestionId(String userId, UUID questionId);
}
