package com.learnnow.admin.application;

import com.learnnow.admin.api.dto.*;
import com.learnnow.admin.persistence.*;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.paths.entity.*;
import com.learnnow.paths.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContentAuthoringService {

    private final PathRepository pathRepository;
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final QuizQuestionRepository quizQuestionRepository;

    @Transactional
    public Path createPath(CreatePathRequest request) {
        Path path = Path.builder()
                .title(request.title())
                .description(request.description())
                .category(request.category() != null ? request.category() : "General")
                .managedBy(request.managedBy() != null ? request.managedBy() : "learnNow")
                .status(ContentStatus.DRAFT)
                .build();
        return pathRepository.save(path);
    }

    @Transactional
    public Topic createTopic(UUID pathId, CreateTopicRequest request) {
        Path path = pathRepository.findById(pathId)
                .orElseThrow(() -> new NotFoundException("path_not_found"));

        Topic topic = Topic.builder()
                .path(path)
                .title(request.title())
                .description(request.description())
                .category(request.category() != null ? request.category() : "course")
                .duration(request.duration() != null ? request.duration() : "1 hour")
                .status(ContentStatus.DRAFT)
                .build();
        return topicRepository.save(topic);
    }

    @Transactional
    public Subtopic createSubtopic(UUID topicId, CreateSubtopicRequest request) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new NotFoundException("topic_not_found"));

        Subtopic subtopic = Subtopic.builder()
                .topic(topic)
                .title(request.title())
                .content(request.content())
                .orderIndex(request.orderIndex())
                .status(ContentStatus.DRAFT)
                .version(1)
                .build();
        return subtopicRepository.save(subtopic);
    }

    @Transactional
    public ContentBlock addContentBlock(UUID subtopicId, CreateContentBlockRequest request) {
        Subtopic subtopic = subtopicRepository.findById(subtopicId)
                .orElseThrow(() -> new NotFoundException("subtopic_not_found"));

        ContentBlock block = ContentBlock.builder()
                .subtopic(subtopic)
                .orderIndex(request.orderIndex())
                .type(request.type())
                .body(request.body())
                .build();
        ContentBlock savedBlock = contentBlockRepository.save(block);

        if (request.questions() != null && !request.questions().isEmpty()) {
            List<QuizQuestion> questions = request.questions().stream()
                    .map(q -> QuizQuestion.builder()
                            .block(savedBlock)
                            .kind(q.kind())
                            .prompt(q.prompt())
                            .options(q.options())
                            .correctAnswer(q.correctAnswer())
                            .explanation(q.explanation())
                            .points(q.points() > 0 ? q.points() : 5)
                            .build())
                    .toList();
            quizQuestionRepository.saveAll(questions);
            savedBlock.setQuestions(questions);
        }

        return savedBlock;
    }

    @Transactional(readOnly = true)
    public List<AdminPathDto> getAllAdminPaths() {
        return pathRepository.findAll().stream()
                .map(this::toAdminPathDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.Optional<AdminPathDto> getAdminPathById(UUID pathId) {
        return pathRepository.findById(pathId)
                .map(this::toAdminPathDto);
    }

    @Transactional
    public AdminPathDto saveOrUpdatePath(AdminPathDto request) {
        Path path;
        if (request.id() != null && pathRepository.existsById(request.id())) {
            path = pathRepository.findById(request.id()).orElseThrow();
        } else {
            path = new Path();
        }

        path.setTitle(request.title());
        path.setDescription(request.description());
        path.setCategory(request.category() != null ? request.category() : "Backend");
        path.setManagedBy(request.managedBy() != null ? request.managedBy() : "learnNow");
        path.setStatus(parseStatus(request.status()));

        if (request.topics() != null) {
            java.util.List<Topic> topics = new java.util.ArrayList<>();
            int tIdx = 1;
            for (AdminPathDto.AdminTopicDto topicReq : request.topics()) {
                Topic topic = Topic.builder()
                        .title(topicReq.title())
                        .description(topicReq.description())
                        .category(topicReq.category() != null ? topicReq.category() : "Topic")
                        .duration(topicReq.duration() != null ? topicReq.duration() : "1 hour")
                        .orderIndex(topicReq.orderIndex() > 0 ? topicReq.orderIndex() : tIdx++)
                        .status(parseStatus(topicReq.status()))
                        .path(path)
                        .build();

                if (topicReq.subtopics() != null) {
                    java.util.List<Subtopic> subtopics = new java.util.ArrayList<>();
                    int idx = 1;
                    for (AdminPathDto.AdminSubtopicDto stReq : topicReq.subtopics()) {
                        Subtopic subtopic = Subtopic.builder()
                                .title(stReq.title())
                                .content(stReq.content())
                                .orderIndex(stReq.orderIndex() > 0 ? stReq.orderIndex() : idx++)
                                .status(parseStatus(stReq.status()))
                                .topic(topic)
                                .build();

                        if (stReq.questions() != null && !stReq.questions().isEmpty()) {
                            com.learnnow.admin.persistence.ContentBlock block = com.learnnow.admin.persistence.ContentBlock.builder()
                                    .subtopic(subtopic)
                                    .type("quiz")
                                    .orderIndex(1)
                                    .build();

                            java.util.List<com.learnnow.admin.persistence.QuizQuestion> questions = new java.util.ArrayList<>();
                            for (AdminPathDto.AdminQuizQuestionDto qReq : stReq.questions()) {
                                String optionsJson = "[]";
                                if (qReq.options() != null) {
                                    try {
                                        optionsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(qReq.options());
                                    } catch (Exception ignored) {}
                                }
                                com.learnnow.admin.persistence.QuizQuestion q = com.learnnow.admin.persistence.QuizQuestion.builder()
                                        .block(block)
                                        .kind(qReq.kind() != null ? qReq.kind() : "mcq")
                                        .prompt(qReq.prompt())
                                        .options(optionsJson)
                                        .correctAnswer(qReq.correctAnswer() != null ? qReq.correctAnswer() : "")
                                        .explanation(qReq.explanation())
                                        .points(qReq.points() > 0 ? qReq.points() : 5)
                                        .build();
                                questions.add(q);
                            }
                            block.setQuestions(questions);
                            subtopic.getBlocks().add(block);
                        }

                        subtopics.add(subtopic);
                    }
                    topic.setSubtopics(subtopics);
                }
                topics.add(topic);
            }
            path.getTopics().clear();
            path.getTopics().addAll(topics);
        }

        Path saved = pathRepository.save(path);
        return toAdminPathDto(saved);
    }

    private ContentStatus parseStatus(String status) {
        if (status == null) return ContentStatus.DRAFT;
        try {
            return ContentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ContentStatus.DRAFT;
        }
    }

    private AdminPathDto toAdminPathDto(Path path) {
        List<AdminPathDto.AdminTopicDto> topics = path.getTopics().stream()
                .sorted(java.util.Comparator.comparingInt(t -> t.getOrderIndex() != null ? t.getOrderIndex() : 0))
                .map(t -> {
                    List<AdminPathDto.AdminSubtopicDto> subtopics = t.getSubtopics().stream()
                            .sorted(java.util.Comparator.comparingInt(st -> st.getOrderIndex()))
                            .map(st -> {
                                List<AdminPathDto.AdminQuizQuestionDto> questions = st.getBlocks() != null ? st.getBlocks().stream()
                                        .filter(b -> "quiz".equalsIgnoreCase(b.getType()) && b.getQuestions() != null)
                                        .flatMap(b -> b.getQuestions().stream())
                                        .map(q -> {
                                            List<String> optsList = List.of();
                                            if (q.getOptions() != null) {
                                                try {
                                                    optsList = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                                                            q.getOptions(),
                                                            new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                                                    );
                                                } catch (Exception ignored) {}
                                            }
                                            return new AdminPathDto.AdminQuizQuestionDto(
                                                    q.getId(),
                                                    q.getKind(),
                                                    q.getPrompt(),
                                                    optsList,
                                                    q.getCorrectAnswer(),
                                                    q.getExplanation(),
                                                    q.getPoints()
                                            );
                                        }).toList() : List.of();

                                return new AdminPathDto.AdminSubtopicDto(
                                        st.getId(),
                                        st.getTitle(),
                                        st.getContent(),
                                        st.getOrderIndex(),
                                        st.getStatus() != null ? st.getStatus().name() : "DRAFT",
                                        questions
                                );
                            }).toList();

                    return new AdminPathDto.AdminTopicDto(
                            t.getId(),
                            t.getTitle(),
                            t.getDescription(),
                            t.getCategory(),
                            t.getDuration(),
                            t.getOrderIndex() != null ? t.getOrderIndex() : 1,
                            t.getStatus() != null ? t.getStatus().name() : "DRAFT",
                            subtopics
                    );
                }).toList();

        return new AdminPathDto(
                path.getId(),
                path.getTitle(),
                path.getDescription(),
                path.getCategory(),
                path.getManagedBy(),
                path.getStatus() != null ? path.getStatus().name() : "DRAFT",
                topics
        );
    }
}
