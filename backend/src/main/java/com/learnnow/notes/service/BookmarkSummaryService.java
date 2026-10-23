package com.learnnow.notes.service;

import com.learnnow.dsa.entity.DsaProgressStatus;
import com.learnnow.dsa.entity.UserDsaProblemProgress;
import com.learnnow.dsa.repository.DsaProblemRepository;
import com.learnnow.dsa.repository.DsaProblemRepository.ProblemHeader;
import com.learnnow.dsa.repository.UserDsaProblemProgressRepository;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.notes.dto.response.BookmarkSummaryResponse;
import com.learnnow.notes.dto.response.BookmarkSummaryResponse.ProblemSummary;
import com.learnnow.notes.dto.response.BookmarkSummaryResponse.TopicSummary;
import com.learnnow.notes.entity.Bookmark;
import com.learnnow.notes.repository.BookmarkRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.repository.PathTopicRepository;
import com.learnnow.paths.repository.PathTopicRepository.TopicPath;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.paths.repository.TopicRepository.TopicHeader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The bookmarks list, resolved: each bookmark with the title, place and progress the list shows.
 *
 * <p>A fixed handful of queries however many bookmarks there are - one per kind of fact, each over
 * every bookmark at once. The client used to make a full content request per bookmark instead.
 *
 * <p>A bookmark whose target is gone or unpublished is left out rather than deleted: the learner
 * may get it back, but there is nothing to link to meanwhile.
 */
@Service
@RequiredArgsConstructor
public class BookmarkSummaryService {

    private final BookmarkRepository bookmarkRepository;
    private final TopicRepository topicRepository;
    private final PathTopicRepository pathTopicRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final DsaProblemRepository problemRepository;
    private final UserDsaProblemProgressRepository problemProgressRepository;

    /** Newest bookmark first, like the ids-only list. */
    @Transactional(readOnly = true)
    public List<BookmarkSummaryResponse> summarise(String userId) {
        List<Bookmark> bookmarks = bookmarkRepository.findAllByUserId(userId);
        List<UUID> topicIds =
                bookmarks.stream().map(Bookmark::getTopicId).filter(Objects::nonNull).toList();
        List<UUID> problemIds =
                bookmarks.stream().map(Bookmark::getDsaProblemId).filter(Objects::nonNull).toList();

        Map<UUID, TopicSummary> topics = topicIds.isEmpty() ? Map.of() : topics(userId, topicIds);
        Map<UUID, ProblemSummary> problems =
                problemIds.isEmpty() ? Map.of() : problems(userId, problemIds);

        List<BookmarkSummaryResponse> summaries = new ArrayList<>();
        for (Bookmark bookmark : bookmarks) {
            TopicSummary topic =
                    bookmark.getTopicId() != null ? topics.get(bookmark.getTopicId()) : null;
            ProblemSummary problem =
                    bookmark.getDsaProblemId() != null
                            ? problems.get(bookmark.getDsaProblemId())
                            : null;
            if (topic == null && problem == null) continue;
            summaries.add(
                    new BookmarkSummaryResponse(
                            bookmark.getId(),
                            bookmark.getTarget(),
                            bookmark.getTargetId(),
                            bookmark.getCreatedAt(),
                            topic,
                            problem));
        }
        return summaries;
    }

    private Map<UUID, TopicSummary> topics(String userId, List<UUID> topicIds) {
        List<TopicHeader> published =
                topicRepository.findHeadersByIdIn(topicIds).stream()
                        .filter(t -> t.getStatus() == ContentStatus.PUBLISHED)
                        .toList();
        if (published.isEmpty()) return Map.of();
        List<UUID> ids = published.stream().map(TopicHeader::getId).toList();

        // Every published path of each topic, its primary path first.
        Map<UUID, List<TopicPath>> pathsByTopic =
                pathTopicRepository.findPublishedPathsOfTopics(ids).stream()
                        .collect(Collectors.groupingBy(TopicPath::getTopicId));
        Map<UUID, UserTopicProgress> progressByTopic =
                topicProgressRepository.findByUserIdAndTopicIdIn(userId, ids).stream()
                        .collect(
                                Collectors.toMap(
                                        UserTopicProgress::getTopicId,
                                        Function.identity(),
                                        (a, b) -> a));
        Map<UUID, Long> lessons = counts(topicRepository.countPublishedLessonsByTopicIds(ids));
        Map<UUID, Long> completed =
                counts(
                        subtopicProgressRepository.countCompletedPublishedLessonsByTopic(
                                userId, ids));

        Map<UUID, TopicSummary> summaries = new HashMap<>();
        for (TopicHeader topic : published) {
            UserTopicProgress progress = progressByTopic.get(topic.getId());
            boolean isCompleted =
                    progress != null && progress.getStatus() == ProgressStatus.COMPLETED;
            TopicPath path =
                    pathFor(
                            pathsByTopic.getOrDefault(topic.getId(), List.of()),
                            progress != null ? progress.getPathId() : null);
            summaries.put(
                    topic.getId(),
                    new TopicSummary(
                            topic.getTitle(),
                            topic.getDescription(),
                            path != null ? path.getPathId() : null,
                            path != null ? path.getPathTitle() : null,
                            percentage(
                                    isCompleted,
                                    lessons.getOrDefault(topic.getId(), 0L),
                                    completed.getOrDefault(topic.getId(), 0L)),
                            isCompleted));
        }
        return summaries;
    }

    /** The path the learner opened the topic from, if still published; else its primary path. */
    private static TopicPath pathFor(List<TopicPath> paths, UUID studiedIn) {
        if (paths.isEmpty()) return null;
        return paths.stream()
                .filter(p -> p.getPathId().equals(studiedIn))
                .findFirst()
                .orElse(paths.get(0));
    }

    private Map<UUID, ProblemSummary> problems(String userId, List<UUID> problemIds) {
        List<ProblemHeader> published = problemRepository.findPublishedHeadersByIdIn(problemIds);
        if (published.isEmpty()) return Map.of();
        Map<UUID, DsaProgressStatus> statusByProblem =
                problemProgressRepository
                        .findByUserIdAndProblemIdIn(
                                userId, published.stream().map(ProblemHeader::getId).toList())
                        .stream()
                        .collect(
                                Collectors.toMap(
                                        UserDsaProblemProgress::getProblemId,
                                        UserDsaProblemProgress::getStatus,
                                        (a, b) -> a));

        Map<UUID, ProblemSummary> summaries = new HashMap<>();
        for (ProblemHeader problem : published) {
            summaries.put(
                    problem.getId(),
                    new ProblemSummary(
                            problem.getSlug(),
                            problem.getTitle(),
                            problem.getDifficulty().name(),
                            problem.getStepSlug(),
                            problem.getStepTitle(),
                            statusByProblem
                                    .getOrDefault(problem.getId(), DsaProgressStatus.NOT_STARTED)
                                    .name()));
        }
        return summaries;
    }

    /** The rounding the Paths page uses, so a topic shows one figure everywhere. */
    private static int percentage(boolean topicCompleted, long lessons, long completed) {
        if (topicCompleted) return 100;
        if (lessons == 0) return 0;
        return (int) Math.round((double) completed * 100 / lessons);
    }

    private static Map<UUID, Long> counts(List<Object[]> rows) {
        return rows.stream()
                .collect(
                        Collectors.toMap(
                                row -> (UUID) row[0], row -> ((Number) row[1]).longValue()));
    }
}
