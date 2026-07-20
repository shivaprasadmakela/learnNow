package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserTopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserTopicProgressRepository extends JpaRepository<UserTopicProgress, UUID> {
    
    Optional<UserTopicProgress> findByUserIdAndTopicId(String userId, Long topicId);
    
    List<UserTopicProgress> findByUserIdAndPathId(String userId, Long pathId);
    
    List<UserTopicProgress> findByUserId(String userId);
}
