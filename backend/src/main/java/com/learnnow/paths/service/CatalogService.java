package com.learnnow.paths.service;

import com.learnnow.learningprogress.entity.UserSubtopicProgress;
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
        return pathRepository.findByStatus(ContentStatus.PUBLISHED).stream()
                .map(
                        path ->
                                new PathSummaryDto(
                                        path.getId(),
                                        path.getTitle(),
                                        path.getDescription(),
                                        path.getCategory(),
                                        path.getManagedBy(),
                                        List.of()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TopicSummaryDto> getTopicsForPath(UUID pathId) {
        return topicRepository.findByPathIdAndStatus(pathId, ContentStatus.PUBLISHED).stream()
                .map(
                        t ->
                                new TopicSummaryDto(
                                        t.getId(),
                                        t.getTitle(),
                                        t.getDescription(),
                                        t.getCategory(),
                                        t.getDuration(),
                                        false))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<PathSummaryDto> getPathDetails(UUID pathId) {
        return pathRepository
                .findById(pathId)
                .map(
                        path ->
                                new PathSummaryDto(
                                        path.getId(),
                                        path.getTitle(),
                                        path.getDescription(),
                                        path.getCategory(),
                                        path.getManagedBy(),
                                        getTopicsForPath(pathId)));
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
                                            .filter(
                                                    st ->
                                                            st.getStatus()
                                                                            == ContentStatus
                                                                                    .PUBLISHED
                                                                    || topic.getStatus()
                                                                            == ContentStatus
                                                                                    .PUBLISHED
                                                                    || (topic.getPath() != null
                                                                            && topic.getPath()
                                                                                            .getStatus()
                                                                                    == ContentStatus
                                                                                            .PUBLISHED))
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

                            return new TopicDetailDto(
                                    topic.getId(),
                                    topic.getTitle(),
                                    topic.getDescription(),
                                    topic.getCategory(),
                                    topic.getDuration(),
                                    topicCompleted,
                                    progressPercentage,
                                    subtopics);
                        });
    }
}
