package com.learnnow.trainer.interview.repository;

import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TopicInterviewRepository extends JpaRepository<TopicInterview, UUID> {

    Optional<TopicInterview> findByIdAndUserId(UUID id, String userId);

    List<TopicInterview> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndCreatedAtAfterAndStatusNot(
            String userId, Instant after, InterviewStatus status);

    boolean existsByUserIdAndTopicIdAndStatus(String userId, UUID topicId, InterviewStatus status);

    List<TopicInterview> findTop5ByUserIdAndStatusOrderByCreatedAtDesc(
            String userId, InterviewStatus status);

    List<TopicInterview> findByStatusAndCreatedAtBefore(InterviewStatus status, Instant before);

    List<TopicInterview> findByStatusAndCompletedAtBefore(InterviewStatus status, Instant before);

    /** Locks the row, so a transcript callback or a scoring run is applied once. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from TopicInterview i where i.id = :id")
    Optional<TopicInterview> findByIdForUpdate(@Param("id") UUID id);
}
