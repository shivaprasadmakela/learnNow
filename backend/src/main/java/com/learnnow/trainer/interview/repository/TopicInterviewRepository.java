package com.learnnow.trainer.interview.repository;

import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Collection;
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

    List<TopicInterview> findTop5ByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndCreatedAtAfterAndStatusNot(
            String userId, Instant after, InterviewStatus status);

    /** Quota use: interviews of some kinds since a moment, not counting ones that failed. */
    long countByUserIdAndKindInAndCreatedAtAfterAndStatusNot(
            String userId, Collection<InterviewKind> kinds, Instant after, InterviewStatus status);

    boolean existsByUserIdAndTopicIdAndStatus(String userId, UUID topicId, InterviewStatus status);

    boolean existsByUserIdAndTopicIdAndKindAndStatus(
            String userId, UUID topicId, InterviewKind kind, InterviewStatus status);

    List<TopicInterview> findTop5ByUserIdAndStatusOrderByCreatedAtDesc(
            String userId, InterviewStatus status);

    List<TopicInterview> findTop5ByUserIdAndKindInAndStatusOrderByCreatedAtDesc(
            String userId, Collection<InterviewKind> kinds, InterviewStatus status);

    List<TopicInterview> findByUserIdAndKindOrderByCreatedAtDesc(String userId, InterviewKind kind);

    List<TopicInterview> findByStatusAndCreatedAtBefore(InterviewStatus status, Instant before);

    List<TopicInterview> findByStatusAndCompletedAtBefore(InterviewStatus status, Instant before);

    /** Evaluations learners called unfair, newest first, for the admin page. */
    List<TopicInterview> findTop20ByLearnerRatingOrderByCreatedAtDesc(Short learnerRating);

    /** Interviews started since a moment, as [kind, status, count]. */
    @Query(
            "SELECT i.kind, i.status, COUNT(i) FROM TopicInterview i WHERE i.createdAt >= :since"
                    + " GROUP BY i.kind, i.status")
    List<Object[]> countByKindAndStatusSince(@Param("since") Instant since);

    /** Locks the row, so a transcript callback or a scoring run is applied once. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from TopicInterview i where i.id = :id")
    Optional<TopicInterview> findByIdForUpdate(@Param("id") UUID id);
}
