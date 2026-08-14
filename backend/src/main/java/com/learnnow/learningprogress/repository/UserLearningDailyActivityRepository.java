package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserLearningDailyActivityRepository
        extends JpaRepository<UserLearningDailyActivity, UUID> {

    Optional<UserLearningDailyActivity> findByUserIdAndActivityDate(
            String userId, LocalDate activityDate);

    List<UserLearningDailyActivity> findByUserIdAndActivityDateIn(
            String userId, List<LocalDate> dates);

    List<UserLearningDailyActivity> findByActivityDateBetween(
            LocalDate startDate, LocalDate endDate);

    /**
     * Returns one row per user with the sum of points_earned and the earliest first_activity_at in
     * the given date range. Used for the leaderboard.
     */
    @Query(
            value =
                    """
                    SELECT
                        a.user_id   AS userId,
                        SUM(a.points_earned)        AS totalPoints,
                        MIN(a.first_activity_at)    AS earliestActivity
                    FROM user_learning_daily_activity a
                    WHERE a.activity_date BETWEEN :start AND :end
                    GROUP BY a.user_id
                    """,
            nativeQuery = true)
    List<WeeklyPointsRow> sumWeeklyPointsByUser(
            @Param("start") LocalDate start, @Param("end") LocalDate end);

    /** Projection used by the leaderboard aggregate query. */
    interface WeeklyPointsRow {
        String getUserId();

        int getTotalPoints();

        java.time.Instant getEarliestActivity();
    }
}
