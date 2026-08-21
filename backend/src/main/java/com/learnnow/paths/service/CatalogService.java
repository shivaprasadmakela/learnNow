package com.learnnow.paths.service;

import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.dao.PathDao;
import com.learnnow.paths.dao.TopicDao;
import com.learnnow.paths.dto.response.CatalogPathDto;
import com.learnnow.paths.dto.response.PathSummaryDto;
import com.learnnow.paths.dto.response.SubtopicDto;
import com.learnnow.paths.dto.response.TopicDetailDto;
import com.learnnow.paths.dto.response.TopicSummaryDto;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.TopicRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final PathRepository pathRepository;
    private final PathDao pathDao;
    private final TopicDao topicDao;
    private final TopicRepository topicRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<CatalogPathDto> getPublicCatalogPaths() {
        return pathRepository.findByStatus(ContentStatus.PUBLISHED).stream()
                .map(
                        path ->
                                new CatalogPathDto(
                                        path.getId(),
                                        path.getTitle(),
                                        path.getDescription(),
                                        path.getCategory(),
                                        path.getManagedBy()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PathSummaryDto> getAllPaths() {
        return getAllPaths(null);
    }

    @Transactional(readOnly = true)
    public List<PathSummaryDto> getAllPaths(String userId) {
        return pathRepository.findByStatus(ContentStatus.PUBLISHED).stream()
                .map(
                        path -> {
                            List<TopicSummaryDto> topics = getTopicsForPath(path.getId(), userId);
                            int pathPct = 0;
                            if (!topics.isEmpty()) {
                                double sumPct =
                                        topics.stream()
                                                .mapToInt(TopicSummaryDto::progressPercentage)
                                                .sum();
                                pathPct = (int) Math.round(sumPct / topics.size());
                            }
                            return new PathSummaryDto(
                                    path.getId(),
                                    path.getTitle(),
                                    path.getDescription(),
                                    path.getCategory(),
                                    path.getManagedBy(),
                                    pathPct,
                                    topics);
                        })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TopicSummaryDto> getTopicsForPath(UUID pathId) {
        return getTopicsForPath(pathId, null);
    }

    @Transactional(readOnly = true)
    public List<TopicSummaryDto> getTopicsForPath(UUID pathId, String userId) {
        List<Topic> topics = topicRepository.findByPathIdAndStatus(pathId, ContentStatus.PUBLISHED);
        if (userId == null || userId.isBlank()) {
            return topics.stream()
                    .map(
                            t ->
                                    new TopicSummaryDto(
                                            t.getId(),
                                            t.getTitle(),
                                            t.getDescription(),
                                            t.getCategory(),
                                            t.getDuration(),
                                            false,
                                            0))
                    .toList();
        }

        List<UserTopicProgress> topicProgresses = topicProgressRepository.findByUserId(userId);
        Map<UUID, ProgressStatus> topicStatusMap =
                topicProgresses.stream()
                        .collect(
                                Collectors.toMap(
                                        UserTopicProgress::getTopicId,
                                        UserTopicProgress::getStatus,
                                        (a, b) -> a));

        List<UserSubtopicProgress> subProgresses = subtopicProgressRepository.findByUserId(userId);
        Map<UUID, Boolean> subtopicCompletionMap =
                subProgresses.stream()
                        .filter(UserSubtopicProgress::isCompleted)
                        .collect(
                                Collectors.toMap(
                                        UserSubtopicProgress::getSubtopicId,
                                        sp -> true,
                                        (a, b) -> a));

        return topics.stream()
                .map(
                        t -> {
                            boolean isCompleted =
                                    topicStatusMap.get(t.getId()) == ProgressStatus.COMPLETED;
                            int pct = 0;
                            if (isCompleted) {
                                pct = 100;
                            } else {
                                List<Subtopic> subtopics = t.getSubtopics();
                                if (subtopics != null && !subtopics.isEmpty()) {
                                    long completedCount =
                                            subtopics.stream()
                                                    .filter(
                                                            st ->
                                                                    Boolean.TRUE.equals(
                                                                            subtopicCompletionMap
                                                                                    .get(
                                                                                            st
                                                                                                    .getId())))
                                                    .count();
                                    pct =
                                            (int)
                                                    Math.round(
                                                            (double) completedCount
                                                                    * 100
                                                                    / subtopics.size());
                                }
                            }
                            return new TopicSummaryDto(
                                    t.getId(),
                                    t.getTitle(),
                                    t.getDescription(),
                                    t.getCategory(),
                                    t.getDuration(),
                                    isCompleted,
                                    pct);
                        })
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<PathSummaryDto> getPathDetails(UUID pathId) {
        return getPathDetails(pathId, null);
    }

    @Transactional(readOnly = true)
    public Optional<PathSummaryDto> getPathDetails(UUID pathId, String userId) {
        return pathRepository
                .findById(pathId)
                .map(
                        path -> {
                            List<TopicSummaryDto> topics = getTopicsForPath(pathId, userId);
                            int pathPct = 0;
                            if (!topics.isEmpty()) {
                                double sumPct =
                                        topics.stream()
                                                .mapToInt(TopicSummaryDto::progressPercentage)
                                                .sum();
                                pathPct = (int) Math.round(sumPct / topics.size());
                            }
                            return new PathSummaryDto(
                                    path.getId(),
                                    path.getTitle(),
                                    path.getDescription(),
                                    path.getCategory(),
                                    path.getManagedBy(),
                                    pathPct,
                                    topics);
                        });
    }

    @Transactional(readOnly = true)
    public Optional<TopicDetailDto> getTopicDetails(UUID id, String userId) {
        return topicDao.findFullTopicDetailsById(id, ContentStatus.PUBLISHED)
                .map(
                        topic -> {
                            boolean topicCompleted =
                                    topicProgressRepository
                                            .findByUserIdAndTopicId(userId, id)
                                            .map(tp -> tp.getStatus() == ProgressStatus.COMPLETED)
                                            .orElse(false);

                            List<UserSubtopicProgress> subProgressList =
                                    subtopicProgressRepository.findByUserIdAndTopicId(userId, id);
                            Map<UUID, Boolean> subtopicCompletionMap =
                                    subProgressList.stream()
                                            .collect(
                                                    Collectors.toMap(
                                                            UserSubtopicProgress::getSubtopicId,
                                                            UserSubtopicProgress::isCompleted));

                            List<SubtopicDto> subtopics =
                                    topic.getSubtopics().stream()
                                            .sorted(
                                                    java.util.Comparator.comparingInt(
                                                            Subtopic::getOrderIndex))
                                            .map(
                                                    st -> {
                                                        List<SubtopicDto.QuizQuestionDto>
                                                                questions =
                                                                        st.getBlocks() != null
                                                                                ? st
                                                                                        .getBlocks()
                                                                                        .stream()
                                                                                        .filter(
                                                                                                b ->
                                                                                                        "quiz"
                                                                                                                        .equalsIgnoreCase(
                                                                                                                                b
                                                                                                                                        .getType())
                                                                                                                && b
                                                                                                                                .getQuestions()
                                                                                                                        != null)
                                                                                        .flatMap(
                                                                                                b ->
                                                                                                        b
                                                                                                                .getQuestions()
                                                                                                                .stream())
                                                                                        .map(
                                                                                                q -> {
                                                                                                    List<
                                                                                                                    String>
                                                                                                            optsList =
                                                                                                                    List
                                                                                                                            .of();
                                                                                                    if (q
                                                                                                                    .getOptions()
                                                                                                            != null) {
                                                                                                        try {
                                                                                                            optsList =
                                                                                                                    objectMapper
                                                                                                                            .readValue(
                                                                                                                                    q
                                                                                                                                            .getOptions(),
                                                                                                                                    new com
                                                                                                                                                    .fasterxml
                                                                                                                                                    .jackson
                                                                                                                                                    .core
                                                                                                                                                    .type
                                                                                                                                                    .TypeReference<
                                                                                                                                            List<
                                                                                                                                                    String>>() {});
                                                                                                        } catch (
                                                                                                                Exception
                                                                                                                        ignored) {
                                                                                                        }
                                                                                                    }
                                                                                                    return new SubtopicDto
                                                                                                            .QuizQuestionDto(
                                                                                                            q
                                                                                                                    .getId(),
                                                                                                            q
                                                                                                                    .getKind(),
                                                                                                            q
                                                                                                                    .getPrompt(),
                                                                                                            optsList,
                                                                                                            null, // Answer key stripped for anti-cheating security
                                                                                                            null, // Explanation revealed only after server-side submit
                                                                                                            q
                                                                                                                    .getPoints());
                                                                                                })
                                                                                        .toList()
                                                                                : List.of();

                                                        List<String> prereqsList = List.of();
                                                        if (st.getPrerequisites() != null) {
                                                            try {
                                                                prereqsList =
                                                                        objectMapper.readValue(
                                                                                st
                                                                                        .getPrerequisites(),
                                                                                new com.fasterxml
                                                                                                .jackson
                                                                                                .core
                                                                                                .type
                                                                                                .TypeReference<
                                                                                        List<
                                                                                                String>>() {});
                                                            } catch (Exception ignored) {
                                                            }
                                                        }

                                                        List<SubtopicDto.CodeSnippetDto> snippets =
                                                                st.getCodeSnippets() != null
                                                                        ? st
                                                                                .getCodeSnippets()
                                                                                .stream()
                                                                                .sorted(
                                                                                        java.util
                                                                                                .Comparator
                                                                                                .comparingInt(
                                                                                                        com
                                                                                                                        .learnnow
                                                                                                                        .paths
                                                                                                                        .entity
                                                                                                                        .SubtopicCodeSnippet
                                                                                                                ::getOrderIndex))
                                                                                .map(
                                                                                        sn ->
                                                                                                new SubtopicDto
                                                                                                        .CodeSnippetDto(
                                                                                                        sn
                                                                                                                .getId(),
                                                                                                        sn
                                                                                                                .getLanguage(),
                                                                                                        sn
                                                                                                                .getLabel(),
                                                                                                        sn
                                                                                                                .getCode(),
                                                                                                        sn
                                                                                                                .getExpectedOutput(),
                                                                                                        sn
                                                                                                                .isRunnable(),
                                                                                                        sn
                                                                                                                .isEditable(),
                                                                                                        sn
                                                                                                                .getOrderIndex()))
                                                                                .toList()
                                                                        : List.of();

                                                        return new SubtopicDto(
                                                                st.getId(),
                                                                st.getTitle(),
                                                                st.getContent(),
                                                                st.getOrderIndex(),
                                                                subtopicCompletionMap.getOrDefault(
                                                                        st.getId(), false),
                                                                st.getLevel() != null
                                                                        ? st.getLevel()
                                                                        : "beginner",
                                                                st.getTrack() != null
                                                                        ? st.getTrack()
                                                                        : "concept",
                                                                prereqsList,
                                                                st.getVideoUrl(),
                                                                st.getEstimatedMinutes() > 0
                                                                        ? st.getEstimatedMinutes()
                                                                        : 5,
                                                                snippets,
                                                                questions);
                                                    })
                                            .toList();

                            int totalSubtopics = subtopics.size();
                            long completedSubtopics =
                                    subtopics.stream().filter(SubtopicDto::isCompleted).count();
                            int progressPercentage =
                                    topicCompleted
                                            ? 100
                                            : (totalSubtopics > 0
                                                    ? (int)
                                                            ((completedSubtopics * 100)
                                                                    / totalSubtopics)
                                                    : 0);

                            int totalMins =
                                    subtopics.stream()
                                            .mapToInt(
                                                    st ->
                                                            st.estimatedMinutes() > 0
                                                                    ? st.estimatedMinutes()
                                                                    : 5)
                                            .sum();
                            String computedDuration =
                                    totalMins >= 60
                                            ? (totalMins % 60 == 0
                                                    ? (totalMins / 60)
                                                            + (totalMins / 60 == 1
                                                                    ? " hour"
                                                                    : " hours")
                                                    : (totalMins / 60)
                                                            + "h "
                                                            + (totalMins % 60)
                                                            + "m")
                                            : (totalMins > 0
                                                    ? totalMins + " mins"
                                                    : (topic.getDuration() != null
                                                            ? topic.getDuration()
                                                            : "15 mins"));

                            return new TopicDetailDto(
                                    topic.getId(),
                                    topic.getTitle(),
                                    topic.getDescription(),
                                    topic.getCategory(),
                                    computedDuration,
                                    topicCompleted,
                                    progressPercentage,
                                    subtopics);
                        });
    }
}
