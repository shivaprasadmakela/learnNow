package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final UserLearningPreferencesRepository preferencesRepository;

    @Transactional
    public void updateStreak(String userId, LocalDate activityDate) {
        UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> UserLearningPreferences.builder()
                        .userId(userId)
                        .build());

        LocalDate lastActive = prefs.getLastActivityDate();

        if (lastActive == null) {
            prefs.setCurrentStreak(1);
            prefs.setLongestStreak(Math.max(prefs.getLongestStreak(), 1));
            prefs.setLastActivityDate(activityDate);
        } else if (lastActive.equals(activityDate)) {
            // Same day, do nothing
        } else if (lastActive.plusDays(1).equals(activityDate)) {
            // Consecutive day
            prefs.setCurrentStreak(prefs.getCurrentStreak() + 1);
            prefs.setLongestStreak(Math.max(prefs.getLongestStreak(), prefs.getCurrentStreak()));
            prefs.setLastActivityDate(activityDate);
        } else {
            // Gap day(s), reset streak
            prefs.setCurrentStreak(1);
            prefs.setLongestStreak(Math.max(prefs.getLongestStreak(), 1));
            prefs.setLastActivityDate(activityDate);
        }

        preferencesRepository.save(prefs);
    }
}
