package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserTopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserTopicProgressRepository extends JpaRepository<UserTopicProgress, UUID> {
    
    Optional<UserTopicProgress> findByUserIdAndTopicId(String userId, UUID topicId);
    
    List<UserTopicProgress> findByUserIdAndPathId(String userId, UUID pathId);
    
    List<UserTopicProgress> findByUserId(String userId);

    @Query("SELECT COUNT(utp) FROM UserTopicProgress utp WHERE utp.userId = :userId AND utp.pathId = :pathId AND utp.status = 'COMPLETED'")
    long countCompletedByUserIdAndPathId(@Param("userId") String userId, @Param("pathId") UUID pathId);
}
