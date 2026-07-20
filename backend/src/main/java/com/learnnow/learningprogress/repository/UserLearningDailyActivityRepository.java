package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserLearningDailyActivityRepository extends JpaRepository<UserLearningDailyActivity, UUID> {
    
    Optional<UserLearningDailyActivity> findByUserIdAndActivityDate(String userId, LocalDate activityDate);
    
    List<UserLearningDailyActivity> findByUserIdAndActivityDateIn(String userId, List<LocalDate> dates);
}
