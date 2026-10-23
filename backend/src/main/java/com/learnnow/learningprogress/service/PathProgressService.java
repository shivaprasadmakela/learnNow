package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.repository.TopicRepository;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * A learner's progress through a set of paths, in three grouped queries whatever the number of
 * paths.
 *
 * <p>The dashboard used to work this out by loading every published path with its topics, then
 * every lesson of each topic it named - content included - and counting in memory. Only counts are
 * needed, so only counts are asked for.
 *
 * <p>A path's percentage is the mean of its published topics', each topic being its share of
 * published lessons completed, or 100 once the topic is marked complete as a whole. That is the
 * figure the Paths page shows, so the dashboard's "completed paths" agrees with it.
 */
@Service
@RequiredArgsConstructor
public class PathProgressService {

    private final TopicRepository topicRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserTopicProgressRepository topicProgressRepository;

    @Transactional(readOnly = true)
    public PathProgress forPaths(Collection<UUID> pathIds, String userId) {
        if (pathIds.isEmpty()) return new PathProgress(Map.of(), Set.of());

        // [pathId, topicId, published lessons] for every published topic of these paths.
        Map<UUID, Map<UUID, Long>> lessonsByPathTopic = new HashMap<>();
        Set<UUID> topicIds = new HashSet<>();
        for (Object[] row : topicRepository.countPublishedLessonsByTopicForPathIds(pathIds)) {
            UUID topicId = (UUID) row[1];
            lessonsByPathTopic
                    .computeIfAbsent((UUID) row[0], k -> new LinkedHashMap<>())
                    .put(topicId, ((Number) row[2]).longValue());
            topicIds.add(topicId);
        }

        Map<UUID, Long> completedByTopic = new HashMap<>();
        Set<UUID> completedTopics = new HashSet<>();
        if (!topicIds.isEmpty()) {
            for (Object[] row :
                    subtopicProgressRepository.countCompletedPublishedLessonsByTopic(
                            userId, topicIds)) {
                completedByTopic.put((UUID) row[0], ((Number) row[1]).longValue());
            }
            completedTopics.addAll(topicProgressRepository.findCompletedTopicIds(userId, topicIds));
        }

        Map<UUID, Integer> percentages = new HashMap<>();
        Set<UUID> unfinished = new HashSet<>();
        for (UUID pathId : pathIds) {
            Map<UUID, Long> topics = lessonsByPathTopic.getOrDefault(pathId, Map.of());
            if (topics.isEmpty()) {
                percentages.put(pathId, 0);
                continue;
            }
            int total = 0;
            for (Map.Entry<UUID, Long> topic : topics.entrySet()) {
                long lessons = topic.getValue();
                if (completedTopics.contains(topic.getKey())) {
                    total += 100;
                } else if (lessons > 0) {
                    long done = completedByTopic.getOrDefault(topic.getKey(), 0L);
                    total += (int) Math.round((double) done * 100 / lessons);
                    if (done < lessons) unfinished.add(pathId);
                }
            }
            percentages.put(pathId, (int) Math.round((double) total / topics.size()));
        }
        return new PathProgress(percentages, unfinished);
    }

    /**
     * @param percentages each path's progress, 0 to 100
     * @param unfinished the paths with a published lesson the learner has not finished - exactly
     *     the ones {@code NextLessonService.firstUnfinished} would find something in
     */
    public record PathProgress(Map<UUID, Integer> percentages, Set<UUID> unfinished) {

        public int percentOf(UUID pathId) {
            return percentages.getOrDefault(pathId, 0);
        }

        public boolean hasUnfinishedLesson(UUID pathId) {
            return unfinished.contains(pathId);
        }

        public int completedCount() {
            return (int) percentages.values().stream().filter(p -> p >= 100).count();
        }
    }
}
