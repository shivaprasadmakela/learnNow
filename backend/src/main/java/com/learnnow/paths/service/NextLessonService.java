package com.learnnow.paths.service;

import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.dto.response.NextLessonDto;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.repository.TopicRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The first lesson of a path a learner has not finished, in teaching order: topic order within the
 * path, lesson order within the topic. A lesson counts as finished when it is completed, or when
 * its whole topic has been marked complete.
 */
@Service
@RequiredArgsConstructor
public class NextLessonService {

    private final TopicRepository topicRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserTopicProgressRepository topicProgressRepository;

    /**
     * Empty when every published lesson of the path is finished, or it has none. With no user, the
     * path's first lesson - where a newcomer starts.
     */
    @Transactional(readOnly = true)
    public Optional<NextLessonDto> firstUnfinished(Path path, String userId) {
        List<Object[]> lessons = topicRepository.findPublishedLessonsInOrder(path.getId());
        if (lessons.isEmpty()) return Optional.empty();

        Set<UUID> doneLessons = new HashSet<>();
        Set<UUID> doneTopics = new HashSet<>();
        if (userId != null) {
            doneLessons.addAll(
                    subtopicProgressRepository.findCompletedSubtopicIds(
                            userId, lessons.stream().map(row -> (UUID) row[2]).toList()));
            doneTopics.addAll(
                    topicProgressRepository.findCompletedTopicIds(
                            userId,
                            lessons.stream().map(row -> (UUID) row[0]).distinct().toList()));
        }
        for (Object[] row : lessons) {
            UUID topicId = (UUID) row[0];
            UUID subtopicId = (UUID) row[2];
            if (doneTopics.contains(topicId) || doneLessons.contains(subtopicId)) continue;
            return Optional.of(
                    new NextLessonDto(
                            path.getId(),
                            path.getTitle(),
                            topicId,
                            (String) row[1],
                            subtopicId,
                            (String) row[3]));
        }
        return Optional.empty();
    }
}
