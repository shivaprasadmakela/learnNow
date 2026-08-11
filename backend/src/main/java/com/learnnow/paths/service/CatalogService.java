package com.learnnow.paths.service;

import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.controller.CatalogController.CatalogPathDetail;
import com.learnnow.paths.controller.CatalogController.CatalogSubtopicTitle;
import com.learnnow.paths.controller.CatalogController.CatalogTopicDetail;
import com.learnnow.paths.dao.PathDao;
import com.learnnow.paths.dto.PathSummaryDto;
import com.learnnow.paths.dto.TopicSummaryDto;
import com.learnnow.paths.dto.SubtopicDto;
import com.learnnow.paths.dto.TopicDetailDto;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import com.learnnow.paths.dao.TopicDao;

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
    public List<PathSummaryDto> getAllPaths() {
        return pathDao.findAllWithTopicsByStatus(ContentStatus.PUBLISHED).stream()
                .map(path -> new PathSummaryDto(
                        path.getId(),
                        path.getTitle(),
                        path.getDescription(),
                        path.getCategory(),
                        path.getManagedBy(),
                        path.getTopics() != null ? path.getTopics().stream()
                                .filter(t -> t.getStatus() == ContentStatus.PUBLISHED || path.getStatus() == ContentStatus.PUBLISHED)
                                .map(t -> new TopicSummaryDto(
                                        t.getId(),
                                        t.getTitle(),
                                        t.getDescription(),
                                        t.getCategory(),
                                        t.getDuration(),
                                        false
                                ))
                                .toList() : List.of()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<CatalogPathDetail> getPathCatalogDetail(UUID pathId) {
        return pathDao.findFullCatalogPathById(pathId)
                .map(path -> {
                    List<CatalogTopicDetail> topics = path.getTopics().stream()
                            .filter(t -> t.getStatus() == ContentStatus.PUBLISHED)
                            .map(topic -> {
                                List<CatalogSubtopicTitle> subtopicTitles = topic.getSubtopics().stream()
                                        .filter(st -> st.getStatus() == ContentStatus.PUBLISHED)
                                        .map(st -> new CatalogSubtopicTitle(st.getId(), st.getTitle(), st.getOrderIndex()))
                                        .toList();
                                return new CatalogTopicDetail(
                                        topic.getId(),
                                        topic.getTitle(),
                                        topic.getDescription(),
                                        topic.getCategory(),
                                        topic.getDuration(),
                                        subtopicTitles
                                );
                            })
                            .toList();
                    return new CatalogPathDetail(
                            path.getId(),
                            path.getTitle(),
                            path.getDescription(),
                            path.getCategory(),
                            path.getManagedBy(),
                            topics
                    );
                });
    }

    @Transactional(readOnly = true)
    public Optional<TopicDetailDto> getTopicDetails(UUID id, String userId) {
        return topicDao.findFullTopicDetailsById(id, ContentStatus.PUBLISHED)
                .map(topic -> {
                    boolean topicCompleted = topicProgressRepository.findByUserIdAndTopicId(userId, id)
                            .map(tp -> tp.getStatus() == ProgressStatus.COMPLETED)
                            .orElse(false);

                    List<UserSubtopicProgress> subProgressList = subtopicProgressRepository
                            .findByUserIdAndTopicId(userId, id);
                    Map<UUID, Boolean> subtopicCompletionMap = subProgressList.stream()
                            .collect(Collectors.toMap(
                                    UserSubtopicProgress::getSubtopicId,
                                    UserSubtopicProgress::isCompleted
                            ));

                    List<SubtopicDto> subtopics = topic.getSubtopics().stream()
                            .filter(st -> st.getStatus() == ContentStatus.PUBLISHED)
                            .map(st -> {
                                List<SubtopicDto.QuizQuestionDto> questions = st.getBlocks() != null ? st.getBlocks().stream()
                                        .filter(b -> "quiz".equalsIgnoreCase(b.getType()) && b.getQuestions() != null)
                                        .flatMap(b -> b.getQuestions().stream())
                                        .map(q -> {
                                            List<String> optsList = List.of();
                                            if (q.getOptions() != null) {
                                                try {
                                                    optsList = objectMapper.readValue(
                                                            q.getOptions(),
                                                            new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                                                    );
                                                } catch (Exception ignored) {}
                                            }
                                            return new SubtopicDto.QuizQuestionDto(
                                                    q.getId(),
                                                    q.getKind(),
                                                    q.getPrompt(),
                                                    optsList,
                                                    null, // Answer key stripped for anti-cheating security
                                                    null, // Explanation revealed only after server-side submit
                                                    q.getPoints()
                                            );
                                        })
                                        .toList() : List.of();

                                List<String> prereqsList = List.of();
                                if (st.getPrerequisites() != null) {
                                    try {
                                        prereqsList = objectMapper.readValue(
                                                st.getPrerequisites(),
                                                new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                                        );
                                    } catch (Exception ignored) {}
                                }

                                List<SubtopicDto.CodeSnippetDto> snippets = st.getCodeSnippets() != null ? st.getCodeSnippets().stream()
                                        .sorted(java.util.Comparator.comparingInt(com.learnnow.paths.entity.SubtopicCodeSnippet::getOrderIndex))
                                        .map(sn -> new SubtopicDto.CodeSnippetDto(
                                                sn.getId(),
                                                sn.getLanguage(),
                                                sn.getLabel(),
                                                sn.getCode(),
                                                sn.getExpectedOutput(),
                                                sn.isRunnable(),
                                                sn.isEditable(),
                                                sn.getOrderIndex()
                                        ))
                                        .toList() : List.of();

                                return new SubtopicDto(
                                        st.getId(),
                                        st.getTitle(),
                                        st.getContent(),
                                        st.getOrderIndex(),
                                        subtopicCompletionMap.getOrDefault(st.getId(), false),
                                        st.getLevel() != null ? st.getLevel() : "beginner",
                                        st.getTrack() != null ? st.getTrack() : "concept",
                                        prereqsList,
                                        st.getVideoUrl(),
                                        st.getEstimatedMinutes() > 0 ? st.getEstimatedMinutes() : 5,
                                        snippets,
                                        questions
                                );
                            })
                            .toList();

                    int totalSubtopics = subtopics.size();
                    long completedSubtopics = subtopics.stream().filter(SubtopicDto::isCompleted).count();
                    int progressPercentage = topicCompleted ? 100 :
                            (totalSubtopics > 0 ? (int) ((completedSubtopics * 100) / totalSubtopics) : 0);

                    return new TopicDetailDto(
                            topic.getId(),
                            topic.getTitle(),
                            topic.getDescription(),
                            topic.getCategory(),
                            topic.getDuration(),
                            topicCompleted,
                            progressPercentage,
                            subtopics
                    );
                });
    }
}
