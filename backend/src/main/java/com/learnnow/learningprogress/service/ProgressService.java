package com.learnnow.learningprogress.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.exception.TopicNotFoundException;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathTopicRepository;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records learner progress and the points that follow from it.
 *
 * <p>Two invariants hold throughout. Completion is <strong>one-way</strong>: nothing here ever
 * un-completes anything, because points are awarded on the transition and are not reversed, so a
 * reversible transition would be a way to mint points. And the owning path is always resolved
 * through {@code path_topics}, never through the legacy {@code topics.path_id} column, which the
 * admin attach flow leaves null.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressService {

    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final PathTopicRepository pathTopicRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final ActivityRecordingService activityRecordingService;

    /**
     * Marks a topic complete. Requests to un-complete are ignored rather than rejected, so a client
     * toggling the control does not see an error.
     */
    @Transactional
    public void setTopicCompletion(String userId, UUID topicId, boolean completed) {
        if (!completed) {
            return;
        }

        Topic topic = topicRepository.findById(topicId).orElseThrow(TopicNotFoundException::new);
        UUID pathId = resolvePathId(topicId);

        UserTopicProgress progress =
                topicProgressRepository
                        .findByUserIdAndTopicId(userId, topicId)
                        .orElseGet(
                                () ->
                                        UserTopicProgress.builder()
                                                .userId(userId)
                                                .topicId(topicId)
                                                .pathId(pathId)
                                                .build());

        if (progress.getStatus() == ProgressStatus.COMPLETED) {
            return;
        }

        progress.setStatus(ProgressStatus.COMPLETED);
        progress.setCompletedAt(Instant.now());
        topicProgressRepository.save(progress);

        UserLearningPreferences prefs = getOrCreatePreferences(userId);
        activityRecordingService.recordTopicCompletion(
                userId, pathId, topicId, ZoneId.of(prefs.getTimezone()), prefs);

        log.debug("Topic {} completed by user {} on path {}", topicId, userId, pathId);
    }

    /**
     * Marks a subtopic complete, cascading to the parent topic once every subtopic is done.
     *
     * <p>Also one-way. Previously {@code completed=false} cleared the flag without reversing the
     * points already granted, so toggling off and on again re-awarded them each time - the topic
     * path guarded against exactly this, the subtopic path did not.
     */
    @Transactional
    public void markSubtopicComplete(String userId, UUID subtopicId, boolean completed) {
        if (!completed) {
            return;
        }

        Subtopic subtopic =
                subtopicRepository
                        .findByIdWithTopic(subtopicId)
                        .orElseThrow(() -> new NotFoundException("subtopic_not_found"));

        Topic topic = subtopic.getTopic();
        UUID topicId = topic.getId();
        UUID pathId = resolvePathId(topicId);

        UserSubtopicProgress subProgress =
                subtopicProgressRepository
                        .findByUserIdAndSubtopicId(userId, subtopicId)
                        .orElseGet(
                                () ->
                                        UserSubtopicProgress.builder()
                                                .userId(userId)
                                                .subtopicId(subtopicId)
                                                .topicId(topicId)
                                                .build());

        if (subProgress.isCompleted()) {
            return;
        }

        subProgress.setCompleted(true);
        subProgress.setCompletedAt(Instant.now());
        subProgress.setContentVersionAnswered(subtopic.getVersion());
        subtopicProgressRepository.save(subProgress);

        UserLearningPreferences prefs = getOrCreatePreferences(userId);
        // recordDailyPoints owns the increment; adding it here as well double-counted.
        activityRecordingService.recordDailyPoints(
                userId, ZoneId.of(prefs.getTimezone()), PointsConfig.SUBTOPIC_COMPLETED, prefs);

        long totalSubtopics = topicRepository.countSubtopicsByTopicId(topicId);
        long completedSubtopics =
                subtopicProgressRepository.countByUserIdAndTopicIdAndCompletedTrue(userId, topicId);

        if (totalSubtopics > 0 && completedSubtopics >= totalSubtopics) {
            setTopicCompletion(userId, topicId, true);
            return;
        }

        UserTopicProgress topicProgress =
                topicProgressRepository
                        .findByUserIdAndTopicId(userId, topicId)
                        .orElseGet(
                                () ->
                                        UserTopicProgress.builder()
                                                .userId(userId)
                                                .topicId(topicId)
                                                .pathId(pathId)
                                                .build());
        if (topicProgress.getStatus() == ProgressStatus.NOT_STARTED) {
            topicProgress.setStatus(ProgressStatus.IN_PROGRESS);
            topicProgressRepository.save(topicProgress);
        }
    }

    /**
     * Resolves a topic's owning path through the join table, falling back to the legacy column only
     * for rows predating the many-to-many migration.
     */
    private UUID resolvePathId(UUID topicId) {
        return pathTopicRepository
                .findPrimaryPathIdByTopicId(topicId)
                .orElseThrow(
                        () -> {
                            log.error("Topic {} is not attached to any path", topicId);
                            return new NotFoundException("topic_not_attached_to_path");
                        });
    }

    private UserLearningPreferences getOrCreatePreferences(String userId) {
        return preferencesRepository
                .findByUserId(userId)
                .orElseGet(
                        () ->
                                preferencesRepository.save(
                                        UserLearningPreferences.builder().userId(userId).build()));
    }
}
