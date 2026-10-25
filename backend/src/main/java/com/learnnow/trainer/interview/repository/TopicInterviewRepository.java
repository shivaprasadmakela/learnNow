package com.learnnow.trainer.interview.repository;

import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicInterviewRepository extends JpaRepository<TopicInterview, UUID> {

    Optional<TopicInterview> findByIdAndUserId(UUID id, String userId);

    List<TopicInterview> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndCreatedAtAfterAndStatusNot(
            String userId, Instant after, InterviewStatus status);

    boolean existsByUserIdAndTopicIdAndStatus(String userId, UUID topicId, InterviewStatus status);

    List<TopicInterview> findTop5ByUserIdAndStatusOrderByCreatedAtDesc(
            String userId, InterviewStatus status);

    List<TopicInterview> findByStatusAndCreatedAtBefore(InterviewStatus status, Instant before);
}
