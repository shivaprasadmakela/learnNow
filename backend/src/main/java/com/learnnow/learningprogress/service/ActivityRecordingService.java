package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.entity.LearningActivityEvent;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.repository.LearningActivityEventRepository;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
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

    private final LearningActivityEventRepository eventRepository;
    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final StreakService streakService;

    @Transactional
    public void recordTopicCompletion(String userId, Long pathId, Long topicId,
                                      UUID clientEventId, ZoneId userZone) {

        if (eventRepository.existsByEventId(clientEventId)) {
            return; // idempotent no-op
        }

        preferencesRepository.findByUserId(userId).orElseGet(() -> preferencesRepository.save(
                UserLearningPreferences.builder().userId(userId).timezone(userZone.getId()).build()
        ));

        int points = 10;
        LearningActivityEvent event = LearningActivityEvent.builder()
                .eventId(clientEventId)
                .userId(userId)
                .pathId(pathId)
                .topicId(topicId)
                .eventType(com.learnnow.learningprogress.enums.ActivityEventType.TOPIC_COMPLETED)
                .pointsAwarded(points)
                .occurredAt(Instant.now())
                .build();
        eventRepository.save(event);

        LocalDate localDate = LocalDate.now(userZone);
        upsertDailyActivity(userId, localDate);
        streakService.updateStreak(userId, localDate);

        preferencesRepository.addPoints(userId, points);
    }

    private void upsertDailyActivity(String userId, LocalDate localDate) {
        UserLearningDailyActivity daily = dailyActivityRepository.findByUserIdAndActivityDate(userId, localDate)
                .orElseGet(() -> UserLearningDailyActivity.builder()
                        .userId(userId)
                        .activityDate(localDate)
                        .firstActivityAt(Instant.now())
                        .build());
        daily.setLastActivityAt(Instant.now());
        daily.setQualifyingEventCount(daily.getQualifyingEventCount() + 1);
        dailyActivityRepository.save(daily);
    }
}
