package com.learnnow.paths.service;

import com.learnnow.common.dto.PageResponse;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.learningprogress.entity.UserQuizAttempt;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.dto.response.CatalogPathDto;
import com.learnnow.paths.dto.response.LessonOutlineDto;
import com.learnnow.paths.dto.response.PathSummaryDto;
import com.learnnow.paths.dto.response.SubtopicDto;
import com.learnnow.paths.dto.response.TopicDetailDto;
import com.learnnow.paths.dto.response.TopicSummaryDto;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.SubtopicCodeSnippet;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.tracks.repository.TrackStepRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final PathRepository pathRepository;
    private final TopicRepository topicRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final SubtopicRepository subtopicRepository;
    private final InterviewQuestionRepository interviewQuestions;
    private final TrackStepRepository trackSteps;
    private final UserQuizAttemptRepository quizAttempts;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Paths come back ordered by title.
     *
     * <p>An unordered page is not stable between requests: with rows free to come back in any
     * order, a client scrolling to page two could be shown paths it already has while others are
     * never reached at all.
     */
    private static Pageable byTitle(Pageable pageable) {
        return PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.ASC, "title"));
    }

    @Transactional(readOnly = true)
    public PageResponse<CatalogPathDto> getPublicCatalogPaths(Pageable pageable) {
        Page<Path> page = pathRepository.findByStatus(ContentStatus.PUBLISHED, byTitle(pageable));
        List<UUID> pathIds = page.getContent().stream().map(Path::getId).toList();
        Map<UUID, Long> topicCounts =
                perPath(pathIds, topicRepository::countPublishedTopicsByPathIds);
        Map<UUID, Long> minutes = perPath(pathIds, topicRepository::sumPublishedMinutesByPathIds);
        return PageResponse.of(
                page.map(
                        path ->
                                new CatalogPathDto(
                                        path.getId(),
                                        path.getTitle(),
                                        path.getDescription(),
                                        path.getCategory(),
                                        path.getManagedBy(),
                                        topicCounts.getOrDefault(path.getId(), 0L),
                                        minutes.getOrDefault(path.getId(), 0L))));
    }

    /** Runs a grouped [pathId, number] query for a page of paths; a path with no row is absent. */
    private static Map<UUID, Long> perPath(
            List<UUID> pathIds, Function<List<UUID>, List<Object[]>> query) {
        if (pathIds.isEmpty()) return Map.of();
        return query.apply(pathIds).stream()
                .collect(
                        Collectors.toMap(
                                row -> (UUID) row[0], row -> ((Number) row[1]).longValue()));
    }

    @Transactional(readOnly = true)
    public PageResponse<PathSummaryDto> getAllPaths(Pageable pageable) {
        return getAllPaths(null, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<PathSummaryDto> getAllPaths(String userId, Pageable pageable) {
        Page<Path> page = pathRepository.findByStatus(ContentStatus.PUBLISHED, byTitle(pageable));
        Map<UUID, PathSummaryDto> summaries = toPathSummaries(page.getContent(), userId);
        return PageResponse.of(page.map(path -> summaries.get(path.getId())));
    }

    /**
     * Summaries for a page of paths, built from grouped queries over the whole page - a handful of
     * queries however many paths there are, and no lesson text read just to count lessons.
     *
     * <p>A path's percentage is the mean across its published topics, and a topic's is the share of
     * its published lessons the learner has completed (100 once the topic is marked complete).
     * Draft lessons count nowhere, so the figure matches what the learner can see.
     */
    private Map<UUID, PathSummaryDto> toPathSummaries(List<Path> paths, String userId) {
        if (paths.isEmpty()) return Map.of();
        List<UUID> pathIds = paths.stream().map(Path::getId).toList();

        Map<UUID, Map<UUID, Long>> lessonsByTopic = new java.util.HashMap<>();
        for (Object[] row : topicRepository.countPublishedLessonsByTopicForPathIds(pathIds)) {
            lessonsByTopic
                    .computeIfAbsent((UUID) row[0], id -> new java.util.LinkedHashMap<>())
                    .put((UUID) row[1], ((Number) row[2]).longValue());
        }
        List<UUID> topicIds =
                lessonsByTopic.values().stream().flatMap(m -> m.keySet().stream()).toList();
        TopicProgress progress = topicProgress(userId, topicIds);

        Map<UUID, Long> minutes = perPath(pathIds, topicRepository::sumPublishedMinutesByPathIds);
        Map<UUID, Long> interview = perPath(pathIds, interviewQuestions::countOpenersByPathIds);
        Map<UUID, List<PathSummaryDto.TrackRef>> tracks = new java.util.HashMap<>();
        for (Object[] row : trackSteps.findTrackRefsForPaths(pathIds)) {
            List<PathSummaryDto.TrackRef> refs =
                    tracks.computeIfAbsent((UUID) row[0], id -> new java.util.ArrayList<>());
            PathSummaryDto.TrackRef ref =
                    new PathSummaryDto.TrackRef((String) row[1], (String) row[2]);
            if (!refs.contains(ref)) refs.add(ref);
        }

        Map<UUID, PathSummaryDto> out = new java.util.HashMap<>();
        for (Path path : paths) {
            Map<UUID, Long> topics = lessonsByTopic.getOrDefault(path.getId(), Map.of());
            int pct =
                    topics.isEmpty()
                            ? 0
                            : (int)
                                    Math.round(
                                            topics.entrySet().stream()
                                                            .mapToInt(
                                                                    e ->
                                                                            progress.percent(
                                                                                    e.getKey(),
                                                                                    e.getValue()))
                                                            .sum()
                                                    / (double) topics.size());
            out.put(
                    path.getId(),
                    new PathSummaryDto(
                            path.getId(),
                            path.getTitle(),
                            path.getDescription(),
                            path.getCategory(),
                            path.getManagedBy(),
                            pct,
                            topics.size(),
                            minutes.getOrDefault(path.getId(), 0L),
                            interview.getOrDefault(path.getId(), 0L).intValue(),
                            List.copyOf(tracks.getOrDefault(path.getId(), List.of()))));
        }
        return out;
    }

    /** A learner's progress over some topics, from two grouped queries; nothing for a guest. */
    private TopicProgress topicProgress(String userId, List<UUID> topicIds) {
        if (userId == null || userId.isBlank() || topicIds.isEmpty()) {
            return new TopicProgress(Set.of(), Map.of());
        }
        Set<UUID> completed =
                new HashSet<>(topicProgressRepository.findCompletedTopicIds(userId, topicIds));
        Map<UUID, Long> lessonsDone =
                subtopicProgressRepository
                        .countCompletedPublishedLessonsByTopic(userId, topicIds)
                        .stream()
                        .collect(
                                Collectors.toMap(
                                        row -> (UUID) row[0],
                                        row -> ((Number) row[1]).longValue()));
        return new TopicProgress(completed, lessonsDone);
    }

    /** Which topics are complete as a whole, and how many published lessons of each are done. */
    private record TopicProgress(Set<UUID> completed, Map<UUID, Long> lessonsDone) {
        boolean isCompleted(UUID topicId) {
            return completed.contains(topicId);
        }

        int percent(UUID topicId, long publishedLessons) {
            if (completed.contains(topicId)) return 100;
            if (publishedLessons <= 0) return 0;
            long done = Math.min(lessonsDone.getOrDefault(topicId, 0L), publishedLessons);
            return (int) Math.round(done * 100.0 / publishedLessons);
        }
    }

    @Transactional(readOnly = true)
    public List<TopicSummaryDto> getTopicsForPath(UUID pathId) {
        return getTopicsForPath(pathId, null);
    }

    /** One page of a path's topics - what the infinite-scrolling topic list requests. */
    @Transactional(readOnly = true)
    public PageResponse<TopicSummaryDto> getTopicsForPath(
            UUID pathId, String userId, Pageable pageable) {
        Page<Topic> page =
                topicRepository.findByPathIdAndStatus(pathId, ContentStatus.PUBLISHED, pageable);
        return PageResponse.of(
                toTopicSummaries(page.getContent(), userId), pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<TopicSummaryDto> getTopicsForPath(UUID pathId, String userId) {
        return toTopicSummaries(
                topicRepository.findByPathIdAndStatus(pathId, ContentStatus.PUBLISHED), userId);
    }

    private List<TopicSummaryDto> toTopicSummaries(List<Topic> topics, String userId) {
        if (topics.isEmpty()) return List.of();
        List<UUID> topicIds = topics.stream().map(Topic::getId).toList();
        Map<UUID, Long> lessons =
                topicRepository.countPublishedLessonsByTopicIds(topicIds).stream()
                        .collect(
                                Collectors.toMap(
                                        row -> (UUID) row[0],
                                        row -> ((Number) row[1]).longValue()));
        TopicProgress progress = topicProgress(userId, topicIds);
        return topics.stream()
                .map(
                        t ->
                                new TopicSummaryDto(
                                        t.getId(),
                                        t.getTitle(),
                                        t.getDescription(),
                                        t.getCategory(),
                                        t.getDuration(),
                                        progress.isCompleted(t.getId()),
                                        progress.percent(
                                                t.getId(), lessons.getOrDefault(t.getId(), 0L))))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<PathSummaryDto> getPathDetails(UUID pathId) {
        return getPathDetails(pathId, null);
    }

    /** A published path's summary; a draft path is not found, title and all. */
    @Transactional(readOnly = true)
    public Optional<PathSummaryDto> getPathDetails(UUID pathId, String userId) {
        return pathRepository
                .findById(pathId)
                .filter(path -> path.getStatus() == ContentStatus.PUBLISHED)
                .map(path -> toPathSummaries(List.of(path), userId).get(path.getId()));
    }

    /**
     * A published topic as the study console opens it: its published lessons as an outline, with
     * the learner's progress. No lesson text, code or quiz - each lesson is fetched with {@link
     * #getLesson} when the learner reaches it.
     */
    @Transactional(readOnly = true)
    public Optional<TopicDetailDto> getTopicDetails(UUID id, String userId) {
        Optional<Topic> found =
                topicRepository.findById(id).filter(t -> t.getStatus() == ContentStatus.PUBLISHED);
        if (found.isEmpty()) return Optional.empty();
        Topic topic = found.get();

        List<SubtopicRepository.LessonRow> rows = subtopicRepository.findPublishedOutline(id);
        List<UUID> lessonIds = rows.stream().map(SubtopicRepository.LessonRow::getId).toList();
        Set<UUID> done =
                userId == null || lessonIds.isEmpty()
                        ? Set.of()
                        : new HashSet<>(
                                subtopicProgressRepository.findCompletedSubtopicIds(
                                        userId, lessonIds));
        Map<UUID, Long> quizzes =
                lessonIds.isEmpty()
                        ? Map.of()
                        : subtopicRepository.countQuizQuestions(lessonIds).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (UUID) row[0],
                                                row -> ((Number) row[1]).longValue()));
        boolean topicCompleted =
                userId != null
                        && topicProgressRepository
                                .findByUserIdAndTopicId(userId, id)
                                .map(tp -> tp.getStatus() == ProgressStatus.COMPLETED)
                                .orElse(false);

        List<LessonOutlineDto> lessons =
                rows.stream()
                        .map(
                                r ->
                                        new LessonOutlineDto(
                                                r.getId(),
                                                r.getTitle(),
                                                r.getOrderIndex(),
                                                done.contains(r.getId()),
                                                r.getLevel() != null ? r.getLevel() : "beginner",
                                                r.getTrack() != null ? r.getTrack() : "concept",
                                                minutesOf(r.getEstimatedMinutes()),
                                                quizzes.getOrDefault(r.getId(), 0L).intValue()))
                        .toList();
        int completed = (int) lessons.stream().filter(LessonOutlineDto::isCompleted).count();
        int progressPercentage =
                topicCompleted ? 100 : (lessons.isEmpty() ? 0 : completed * 100 / lessons.size());
        int totalMins = lessons.stream().mapToInt(LessonOutlineDto::estimatedMinutes).sum();
        int interview = lessonIds.isEmpty() ? 0 : (int) interviewQuestions.countOpeners(lessonIds);

        return Optional.of(
                new TopicDetailDto(
                        topic.getId(),
                        topic.getTitle(),
                        topic.getDescription(),
                        topic.getCategory(),
                        duration(totalMins, topic.getDuration()),
                        topicCompleted,
                        progressPercentage,
                        interview,
                        lessons));
    }

    /**
     * One published lesson of a published topic in full: text, code and concept check. A quiz
     * question goes out without its answer; a question the learner has already answered carries
     * that attempt, with the answer and explanation when it was answered correctly.
     */
    @Transactional(readOnly = true)
    public Optional<SubtopicDto> getLesson(UUID subtopicId, String userId) {
        Optional<Subtopic> found =
                subtopicRepository
                        .findByIdWithTopic(subtopicId)
                        .filter(st -> st.getStatus() == ContentStatus.PUBLISHED)
                        .filter(st -> st.getTopic().getStatus() == ContentStatus.PUBLISHED);
        if (found.isEmpty()) return Optional.empty();
        Subtopic st = found.get();

        List<com.learnnow.admin.entity.QuizQuestion> quiz =
                st.getBlocks() == null
                        ? List.of()
                        : st.getBlocks().stream()
                                .filter(
                                        b ->
                                                "quiz".equalsIgnoreCase(b.getType())
                                                        && b.getQuestions() != null)
                                .flatMap(b -> b.getQuestions().stream())
                                .toList();
        Map<UUID, UserQuizAttempt> attempts =
                userId == null || quiz.isEmpty()
                        ? Map.of()
                        : quizAttempts
                                .findByUserIdAndQuestionIdIn(
                                        userId,
                                        quiz.stream()
                                                .map(com.learnnow.admin.entity.QuizQuestion::getId)
                                                .toList())
                                .stream()
                                .collect(
                                        Collectors.toMap(
                                                UserQuizAttempt::getQuestionId,
                                                a -> a,
                                                (a, b) -> a));
        boolean completed =
                userId != null
                        && !subtopicProgressRepository
                                .findCompletedSubtopicIds(userId, List.of(subtopicId))
                                .isEmpty();

        List<SubtopicDto.QuizQuestionDto> questions =
                quiz.stream()
                        .map(
                                q -> {
                                    UserQuizAttempt a = attempts.get(q.getId());
                                    return new SubtopicDto.QuizQuestionDto(
                                            q.getId(),
                                            q.getKind(),
                                            q.getPrompt(),
                                            readList(q.getOptions()),
                                            q.getPoints(),
                                            a == null
                                                    ? null
                                                    // As the quiz check itself does: the
                                                    // answer is shown once it was answered
                                                    // correctly, not after a miss.
                                                    : new SubtopicDto.Attempt(
                                                            a.isCorrect(),
                                                            a.isCorrect()
                                                                    ? q.getCorrectAnswer()
                                                                    : null,
                                                            a.isCorrect()
                                                                    ? q.getExplanation()
                                                                    : null));
                                })
                        .toList();
        List<SubtopicDto.CodeSnippetDto> snippets =
                st.getCodeSnippets() == null
                        ? List.of()
                        : st.getCodeSnippets().stream()
                                .sorted(
                                        java.util.Comparator.comparingInt(
                                                SubtopicCodeSnippet::getOrderIndex))
                                .map(
                                        sn ->
                                                new SubtopicDto.CodeSnippetDto(
                                                        sn.getId(),
                                                        sn.getLanguage(),
                                                        sn.getLabel(),
                                                        sn.getCode(),
                                                        hasText(sn.getExpectedOutput()),
                                                        sn.isRunnable(),
                                                        sn.isEditable(),
                                                        sn.getOrderIndex()))
                                .toList();

        return Optional.of(
                new SubtopicDto(
                        st.getId(),
                        st.getTitle(),
                        st.getContent(),
                        st.getOrderIndex(),
                        completed,
                        st.getLevel() != null ? st.getLevel() : "beginner",
                        st.getTrack() != null ? st.getTrack() : "concept",
                        readList(st.getPrerequisites()),
                        st.getVideoUrl(),
                        minutesOf(st.getEstimatedMinutes()),
                        snippets,
                        questions));
    }

    /**
     * What a runnable snippet of a published lesson is expected to print - asked for once the
     * learner has run it, so a "predict the output" snippet does not give its answer away first.
     */
    @Transactional(readOnly = true)
    public Optional<String> getExpectedOutput(UUID subtopicId, String snippetId) {
        return subtopicRepository
                .findByIdWithTopic(subtopicId)
                .filter(st -> st.getStatus() == ContentStatus.PUBLISHED)
                .filter(st -> st.getTopic().getStatus() == ContentStatus.PUBLISHED)
                .flatMap(
                        st ->
                                st.getCodeSnippets() == null
                                        ? Optional.empty()
                                        : st.getCodeSnippets().stream()
                                                .filter(sn -> sn.getId().equals(snippetId))
                                                .findFirst())
                .map(SubtopicCodeSnippet::getExpectedOutput)
                .filter(CatalogService::hasText);
    }

    private List<String> readList(String json) {
        if (json == null) return List.of();
        try {
            return objectMapper.readValue(
                    json, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    /** A lesson's authored estimate, or five minutes when none was given. */
    private static int minutesOf(int estimatedMinutes) {
        return estimatedMinutes > 0 ? estimatedMinutes : 5;
    }

    /** "2 hours", "1h 30m", "45 mins" - or the topic's own label when it has no lessons. */
    private static String duration(int totalMins, String fallback) {
        if (totalMins >= 60) {
            int hours = totalMins / 60;
            return totalMins % 60 == 0
                    ? hours + (hours == 1 ? " hour" : " hours")
                    : hours + "h " + (totalMins % 60) + "m";
        }
        if (totalMins > 0) return totalMins + " mins";
        return fallback != null ? fallback : "15 mins";
    }
}
