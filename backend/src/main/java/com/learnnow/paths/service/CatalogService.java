package com.learnnow.paths.service;

import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.controller.CatalogController.CatalogPathDetail;
import com.learnnow.paths.controller.CatalogController.CatalogSubtopicTitle;
import com.learnnow.paths.controller.CatalogController.CatalogTopicDetail;
import com.learnnow.paths.dto.PathSummaryDto;
import com.learnnow.paths.dto.SubtopicDto;
import com.learnnow.paths.dto.TopicDetailDto;
import com.learnnow.paths.dto.TopicSummaryDto;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final PathRepository pathRepository;
    private final TopicRepository topicRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;

    @Transactional(readOnly = true)
    public List<PathSummaryDto> getAllPaths() {
        return pathRepository.findAll().stream()
                .map(path -> new PathSummaryDto(
                        path.getId(),
                        path.getTitle(),
                        path.getDescription(),
                        path.getCategory(),
                        path.getManagedBy(),
                        List.of()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<CatalogPathDetail> getPathCatalogDetail(Long pathId) {
        return pathRepository.findById(pathId)
                .map(path -> {
                    List<CatalogTopicDetail> topics = path.getTopics().stream()
                            .map(topic -> {
                                List<CatalogSubtopicTitle> subtopicTitles = topic.getSubtopics().stream()
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
    public Optional<TopicDetailDto> getTopicDetails(Long id, String userId) {
        return topicRepository.findByIdWithSubtopics(id)
                .map(topic -> {
                    boolean topicCompleted = topicProgressRepository.findByUserIdAndTopicId(userId, id)
                            .map(tp -> tp.getStatus() == ProgressStatus.COMPLETED)
                            .orElse(false);

                    // Build subtopic completion lookup
                    List<UserSubtopicProgress> subProgressList = subtopicProgressRepository
                            .findByUserIdAndTopicId(userId, id);
                    Map<Long, Boolean> subtopicCompletionMap = subProgressList.stream()
                            .collect(Collectors.toMap(
                                    UserSubtopicProgress::getSubtopicId,
                                    UserSubtopicProgress::isCompleted
                            ));

                    List<SubtopicDto> subtopics = topic.getSubtopics().stream()
                            .map(st -> new SubtopicDto(
                                    st.getId(),
                                    st.getTitle(),
                                    st.getContent(),
                                    st.getOrderIndex(),
                                    subtopicCompletionMap.getOrDefault(st.getId(), false)
                            ))
                            .toList();

                    // Calculate progress percentage
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

