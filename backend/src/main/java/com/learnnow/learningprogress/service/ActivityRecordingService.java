package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityRecordingService {

    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final PathRepository pathRepository;
    private final StreakService streakService;

    @Transactional
    public void recordTopicCompletion(String userId, Long pathId, Long topicId, ZoneId userZone) {

        UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> preferencesRepository.save(
                        UserLearningPreferences.builder().userId(userId).timezone(userZone.getId()).build()
                ));

        LocalDate localDate = LocalDate.now(userZone);

        expireStreakIfStale(prefs, localDate);

        // Update streak & check milestone bonus
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

    @Transactional
    public void recordDailyPoints(String userId, ZoneId userZone, int points) {
        UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> preferencesRepository.save(
                        UserLearningPreferences.builder().userId(userId).timezone(userZone.getId()).build()
                ));
        LocalDate localDate = LocalDate.now(userZone);
        expireStreakIfStale(prefs, localDate);
        streakService.updateStreak(prefs, localDate);
        preferencesRepository.save(prefs);
        upsertDailyActivity(userId, localDate, points);
    }

    private boolean isPathCompleted(String userId, Long pathId) {
        Path path = pathRepository.findById(pathId).orElse(null);
        if (path == null) return false;

        List<Topic> topics = path.getTopics();
        if (topics.isEmpty()) return false;

        List<UserTopicProgress> progressList = topicProgressRepository.findByUserIdAndPathId(userId, pathId);
        long completedCount = progressList.stream()
                .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                .count();

        return completedCount >= topics.size();
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
    /**
     * If the user's last activity was before yesterday, their active streak has expired.
     * Reset it to 0 so the next activity starts fresh from 1.
     * This must happen on the write path — never on a read (dashboard GET).
     */
    private void expireStreakIfStale(UserLearningPreferences prefs, LocalDate today) {
        if (prefs.getLastActivityDate() != null
                && prefs.getLastActivityDate().isBefore(today.minusDays(1))
                && prefs.getCurrentStreak() != 0) {
            prefs.setCurrentStreak(0);
        }
    }
}
