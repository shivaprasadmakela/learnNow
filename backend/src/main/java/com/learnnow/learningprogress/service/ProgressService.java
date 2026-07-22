package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.exception.TopicNotFoundException;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Kolkata");

    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final ActivityRecordingService activityRecordingService;

    /**
     * Explicitly mark a topic as completed/uncompleted (manual toggle by user).
     */
    @Transactional
    public void setTopicCompletion(String userId, Long topicId, boolean completed) {
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
        activityRecordingService.recordTopicCompletion(userId, topic.getPath().getId(), topicId, userZone);
    }

    /**
     * Mark a subtopic as completed. If all subtopics in the topic are now complete,
     * auto-complete the parent topic (triggering streak + points + activity recording).
     */
    @Transactional
    public void markSubtopicComplete(String userId, Long subtopicId, boolean completed) {
        Subtopic subtopic = subtopicRepository.findById(subtopicId)
                .orElseThrow(() -> new NotFoundException("subtopic_not_found"));

        Topic topic = subtopic.getTopic();
        Long topicId = topic.getId();

        // Upsert subtopic progress
        UserSubtopicProgress subProgress = subtopicProgressRepository
                .findByUserIdAndSubtopicId(userId, subtopicId)
                .orElseGet(() -> UserSubtopicProgress.builder()
                        .userId(userId)
                        .subtopicId(subtopicId)
                        .topicId(topicId)
                        .build());

        if (completed && subProgress.isCompleted()) {
            return; // already completed, no-op
        }

        subProgress.setCompleted(completed);
        subProgress.setCompletedAt(completed ? Instant.now() : null);
        subtopicProgressRepository.save(subProgress);

        if (completed) {
            // Award subtopic points directly on entity
            UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                    .orElseGet(() -> UserLearningPreferences.builder()
                            .userId(userId)
                            .build());
            prefs.addPoints(PointsConfig.SUBTOPIC_COMPLETED);
            preferencesRepository.save(prefs);

            ZoneId userZone = ZoneId.of(prefs.getTimezone());
            activityRecordingService.recordDailyPoints(userId, userZone, PointsConfig.SUBTOPIC_COMPLETED);

            // Check if all subtopics in this topic are now complete
            long totalSubtopics = topic.getSubtopics().size();
            long completedSubtopics = subtopicProgressRepository.countByUserIdAndTopicIdAndCompletedTrue(userId, topicId);

            if (totalSubtopics > 0 && completedSubtopics >= totalSubtopics) {
                // Auto-complete the parent topic
                setTopicCompletion(userId, topicId, true);
            } else {
                // Mark topic as IN_PROGRESS if not already
                UserTopicProgress topicProgress = topicProgressRepository.findByUserIdAndTopicId(userId, topicId)
                        .orElseGet(() -> UserTopicProgress.builder()
                                .userId(userId)
                                .topicId(topicId)
                                .pathId(topic.getPath().getId())
                                .build());
                if (topicProgress.getStatus() == ProgressStatus.NOT_STARTED) {
                    topicProgress.setStatus(ProgressStatus.IN_PROGRESS);
                    topicProgressRepository.save(topicProgress);
                }
            }
        }
    }

}
