package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.LearningActivityEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface LearningActivityEventRepository extends JpaRepository<LearningActivityEvent, UUID> {
    
    boolean existsByEventId(UUID eventId);
    
    List<LearningActivityEvent> findByUserIdOrderByOccurredAtDesc(String userId, Pageable pageable);

    @Query("SELECT e FROM LearningActivityEvent e WHERE e.userId = :userId AND " +
           "(e.occurredAt < :occurredAt OR (e.occurredAt = :occurredAt AND e.id < :id)) " +
           "ORDER BY e.occurredAt DESC, e.id DESC")
    List<LearningActivityEvent> findCursorPaginated(
            @Param("userId") String userId,
            @Param("occurredAt") Instant occurredAt,
            @Param("id") UUID id,
            Pageable pageable
    );
}
