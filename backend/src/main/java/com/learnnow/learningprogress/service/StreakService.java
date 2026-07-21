package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
public class StreakService {

    public int updateStreak(UserLearningPreferences prefs, LocalDate activityDate) {
        prefs.updateStreak(activityDate);
        return prefs.getCurrentStreak();
    }

    public int getMilestoneBonus(int currentStreak) {
        if (currentStreak == 3) {
            return PointsConfig.STREAK_BONUS_3_DAYS;
        } else if (currentStreak == 7) {
            return PointsConfig.STREAK_BONUS_7_DAYS;
        } else if (currentStreak == 30) {
            return PointsConfig.STREAK_BONUS_30_DAYS;
        }
        return 0;
    }
}
