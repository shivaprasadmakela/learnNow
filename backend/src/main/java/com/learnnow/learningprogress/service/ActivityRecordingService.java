package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityRecordingService {

    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final TopicRepository topicRepository;
    private final StreakService streakService;

    /**
     * Record topic completion with pre-loaded preferences (avoids duplicate DB lookup).
     */
    @Transactional
    public void recordTopicCompletion(String userId, UUID pathId, UUID topicId, ZoneId userZone, UserLearningPreferences prefs) {

        LocalDate localDate = LocalDate.now(userZone);

        expireStreakIfStale(prefs, localDate);

        int newStreak = streakService.updateStreak(prefs, localDate);
        int milestoneBonus = streakService.getMilestoneBonus(newStreak);

        int pointsToAward = PointsConfig.TOPIC_COMPLETED_BONUS + milestoneBonus;
        if (isPathCompleted(userId, pathId)) {
            pointsToAward += PointsConfig.PATH_COMPLETED_BONUS;
        }

        prefs.addPoints(pointsToAward);
        preferencesRepository.save(prefs);

        upsertDailyActivity(userId, localDate, pointsToAward);
    }

    /**
     * Record daily points with pre-loaded preferences (avoids duplicate DB lookup).
     */
    @Transactional
    public void recordDailyPoints(String userId, ZoneId userZone, int points, UserLearningPreferences prefs) {
        LocalDate localDate = LocalDate.now(userZone);
        expireStreakIfStale(prefs, localDate);
        streakService.updateStreak(prefs, localDate);
        preferencesRepository.save(prefs);
        upsertDailyActivity(userId, localDate, points);
    }

    /**
     * Fallback: loads prefs from DB when caller doesn't have them.
     */
    @Transactional
    public void recordDailyPoints(String userId, ZoneId userZone, int points) {
        UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> preferencesRepository.save(
                        UserLearningPreferences.builder().userId(userId).timezone(userZone.getId()).build()
                ));
        recordDailyPoints(userId, userZone, points, prefs);
    }

    /**
     * Uses count queries instead of loading all Path → Topics entities.
     */
    private boolean isPathCompleted(String userId, UUID pathId) {
        long totalTopics = topicRepository.countPublishedTopicsByPathId(pathId);
        if (totalTopics == 0) return false;

        long completedCount = topicProgressRepository.countCompletedByUserIdAndPathId(userId, pathId);
        return completedCount >= totalTopics;
    }

    private void upsertDailyActivity(String userId, LocalDate localDate, int points) {
        UserLearningDailyActivity daily = dailyActivityRepository.findByUserIdAndActivityDate(userId, localDate)
                .orElseGet(() -> UserLearningDailyActivity.builder()
                        .userId(userId)
                        .activityDate(localDate)
                        .firstActivityAt(Instant.now())
                        .build());
        daily.setLastActivityAt(Instant.now());
        daily.setQualifyingEventCount(daily.getQualifyingEventCount() + 1);
        daily.addPoints(points);
        dailyActivityRepository.save(daily);
    }

    private void expireStreakIfStale(UserLearningPreferences prefs, LocalDate today) {
        if (prefs.getLastActivityDate() != null
                && prefs.getLastActivityDate().isBefore(today.minusDays(1))
                && prefs.getCurrentStreak() != 0) {
            prefs.setCurrentStreak(0);
        }
    }
}
