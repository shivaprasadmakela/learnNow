package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserLearningPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserLearningPreferencesRepository extends JpaRepository<UserLearningPreferences, String> {
    
    Optional<UserLearningPreferences> findByUserId(String userId);

    @Modifying
    @Query("UPDATE UserLearningPreferences p SET p.totalPoints = p.totalPoints + :points, p.updatedAt = CURRENT_TIMESTAMP WHERE p.userId = :userId")
    int addPoints(@Param("userId") String userId, @Param("points") int points);
}
