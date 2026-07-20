package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.exception.TopicNotFoundException;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Kolkata");

    private final TopicRepository topicRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final ActivityRecordingService activityRecordingService;

    @Transactional
    public void setTopicCompletion(String userId, Long topicId, boolean completed, UUID eventId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(TopicNotFoundException::new);

        UserTopicProgress progress = topicProgressRepository.findByUserIdAndTopicId(userId, topicId)
                .orElseGet(() -> UserTopicProgress.builder()
                        .userId(userId)
                        .topicId(topicId)
                        .pathId(topic.getPath().getId())
                        .build());

        if (!completed) {
            progress.setStatus(ProgressStatus.NOT_STARTED);
            progress.setCompletedAt(null);
            topicProgressRepository.save(progress);
            return;
        }

        if (progress.getStatus() == ProgressStatus.COMPLETED) {
            return;
        }

        progress.setStatus(ProgressStatus.COMPLETED);
        progress.setCompletedAt(Instant.now());
        topicProgressRepository.save(progress);

        ZoneId userZone = preferencesRepository.findByUserId(userId)
                .map(preferences -> ZoneId.of(preferences.getTimezone()))
                .orElse(DEFAULT_ZONE);
        activityRecordingService.recordTopicCompletion(userId, topic.getPath().getId(), topicId, eventId, userZone);
    }
}
