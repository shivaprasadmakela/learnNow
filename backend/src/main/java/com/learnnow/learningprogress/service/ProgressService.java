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
import java.util.UUID;

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
    public void setTopicCompletion(String userId, UUID topicId, boolean completed) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(TopicNotFoundException::new);

        UserTopicProgress progress = topicProgressRepository.findByUserIdAndTopicId(userId, topicId)
                .orElseGet(() -> UserTopicProgress.builder()
                        .userId(userId)
                        .topicId(topicId)
                        .pathId(topic.getPath().getId())
                        .build());

        if (!completed) {
            // One-way completion: unmarking is disallowed to prevent point duplication
            return;
        }

        if (progress.getStatus() == ProgressStatus.COMPLETED) {
            return;
        }

        progress.setStatus(ProgressStatus.COMPLETED);
        progress.setCompletedAt(Instant.now());
        topicProgressRepository.save(progress);

        UserLearningPreferences prefs = getOrCreatePreferences(userId);
        ZoneId userZone = ZoneId.of(prefs.getTimezone());
        activityRecordingService.recordTopicCompletion(userId, topic.getPath().getId(), topicId, userZone, prefs);
    }

    /**
     * Mark a subtopic as completed. If all subtopics in the topic are now complete,
     * auto-complete the parent topic (triggering streak + points + activity recording).
     *
     * Optimized: uses JOIN FETCH for subtopic→topic, count queries instead of
     * loading collections, and passes pre-loaded preferences to avoid duplicate lookups.
     */
    @Transactional
    public void markSubtopicComplete(String userId, UUID subtopicId, boolean completed) {
        // JOIN FETCH: loads subtopic + topic in single query (eliminates lazy-load)
        Subtopic subtopic = subtopicRepository.findByIdWithTopic(subtopicId)
                .orElseThrow(() -> new NotFoundException("subtopic_not_found"));

        Topic topic = subtopic.getTopic();
        UUID topicId = topic.getId();

        UserSubtopicProgress subProgress = subtopicProgressRepository
                .findByUserIdAndSubtopicId(userId, subtopicId)
                .orElseGet(() -> UserSubtopicProgress.builder()
                        .userId(userId)
                        .subtopicId(subtopicId)
                        .topicId(topicId)
                        .build());

        if (completed && subProgress.isCompleted()) {
            return;
        }

        subProgress.setCompleted(completed);
        subProgress.setCompletedAt(completed ? Instant.now() : null);
        subProgress.setContentVersionAnswered(subtopic.getVersion());
        subtopicProgressRepository.save(subProgress);

        if (completed) {
            // Load prefs ONCE and pass everywhere (eliminates 2 duplicate DB lookups)
            UserLearningPreferences prefs = getOrCreatePreferences(userId);
            prefs.addPoints(PointsConfig.SUBTOPIC_COMPLETED);
            preferencesRepository.save(prefs);

            ZoneId userZone = ZoneId.of(prefs.getTimezone());
            activityRecordingService.recordDailyPoints(userId, userZone, PointsConfig.SUBTOPIC_COMPLETED, prefs);

            // Count query instead of lazy-loading all subtopics collection
            long totalSubtopics = topicRepository.countSubtopicsByTopicId(topicId);
            long completedSubtopics = subtopicProgressRepository.countByUserIdAndTopicIdAndCompletedTrue(userId, topicId);

            if (totalSubtopics > 0 && completedSubtopics >= totalSubtopics) {
                setTopicCompletion(userId, topicId, true);
            } else {
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

    private UserLearningPreferences getOrCreatePreferences(String userId) {
        return preferencesRepository.findByUserId(userId)
                .orElseGet(() -> UserLearningPreferences.builder()
                        .userId(userId)
                        .build());
    }
}
