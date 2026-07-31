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
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

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
                                        optionsJson = objectMapper.writeValueAsString(qReq.options());
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

    @Transactional(readOnly = true)
    public ImportValidationResultDto validateImportConflicts(ImportCourseRequest request) {
        List<ImportConflictItemDto> conflicts = new java.util.ArrayList<>();

        if (request.pathId() == null) {
            // CREATE mode: check if path with same title exists
            if (request.title() != null && !request.title().isBlank()) {
                pathRepository.findByTitleIgnoreCase(request.title().trim()).ifPresent(p -> {
                    conflicts.add(new ImportConflictItemDto(
                            "PATH",
                            p.getTitle(),
                            p.getId(),
                            "A learning path titled '" + p.getTitle() + "' already exists."
                    ));
                });
            }
        } else {
            // APPEND mode: check existing topics in target path
            Path existingPath = pathRepository.findById(request.pathId()).orElse(null);
            if (existingPath != null && request.topics() != null) {
                for (ImportCourseRequest.ImportTopicRequest tReq : request.topics()) {
                    if (tReq.title() == null || tReq.title().isBlank()) continue;
                    String tTitle = tReq.title().trim();

                    existingPath.getTopics().stream()
                            .filter(t -> t.getTitle() != null && t.getTitle().equalsIgnoreCase(tTitle))
                            .findFirst()
                            .ifPresent(existingTopic -> {
                                conflicts.add(new ImportConflictItemDto(
                                        "TOPIC",
                                        existingTopic.getTitle(),
                                        existingTopic.getId(),
                                        "Topic '" + existingTopic.getTitle() + "' already exists in path '" + existingPath.getTitle() + "'."
                                ));

                                if (tReq.subtopics() != null) {
                                    for (ImportCourseRequest.ImportSubtopicRequest stReq : tReq.subtopics()) {
                                        if (stReq.title() == null || stReq.title().isBlank()) continue;
                                        String stTitle = stReq.title().trim();

                                        existingTopic.getSubtopics().stream()
                                                .filter(st -> st.getTitle() != null && st.getTitle().equalsIgnoreCase(stTitle))
                                                .findFirst()
                                                .ifPresent(existingSub -> {
                                                    conflicts.add(new ImportConflictItemDto(
                                                            "SUBTOPIC",
                                                            existingSub.getTitle(),
                                                            existingSub.getId(),
                                                            "Subtopic '" + existingSub.getTitle() + "' already exists in topic '" + existingTopic.getTitle() + "'."
                                                    ));
                                                });
                                    }
                                }
                            });
                }
            }
        }

        return new ImportValidationResultDto(!conflicts.isEmpty(), conflicts);
    }

    @Transactional
    public ImportResultDto importCourse(ImportCourseRequest request) {
        String strategy = request.conflictStrategy() != null && !request.conflictStrategy().isBlank()
                ? request.conflictStrategy().toUpperCase()
                : "FAIL_ON_CONFLICT";

        // Pre-check for conflicts if default strategy or explicitly requested
        if ("FAIL_ON_CONFLICT".equals(strategy)) {
            ImportValidationResultDto validation = validateImportConflicts(request);
            if (validation.hasConflicts()) {
                String firstMsg = validation.conflicts().get(0).message();
                throw new com.learnnow.common.exception.ConflictException(firstMsg);
            }
        }

        if (request.pathId() == null && strategy.equals("FAIL_ON_CONFLICT")) {
            if (request.title() == null || request.title().isBlank()) {
                throw new com.learnnow.common.exception.ValidationException("title is required when creating a new course");
            }
            if (request.description() == null || request.description().isBlank()) {
                throw new com.learnnow.common.exception.ValidationException("description is required when creating a new course");
            }
        }

        boolean isAppend = request.pathId() != null;
        Path path;
        int startOrderIndex;

        if (isAppend) {
            path = pathRepository.findById(request.pathId())
                    .orElseThrow(() -> new com.learnnow.common.exception.NotFoundException("path_not_found"));
            startOrderIndex = path.getTopics().stream()
                    .mapToInt(t -> t.getOrderIndex() != null ? t.getOrderIndex() : 0)
                    .max()
                    .orElse(0) + 1;
        } else {
            java.util.Optional<Path> existingPathOpt = (request.title() != null && !request.title().isBlank())
                    ? pathRepository.findByTitleIgnoreCase(request.title().trim())
                    : java.util.Optional.empty();

            if (existingPathOpt.isPresent() && "OVERWRITE".equals(strategy)) {
                path = existingPathOpt.get();
                if (request.description() != null) path.setDescription(request.description());
                if (request.category() != null) path.setCategory(request.category());
                startOrderIndex = path.getTopics().stream()
                        .mapToInt(t -> t.getOrderIndex() != null ? t.getOrderIndex() : 0)
                        .max()
                        .orElse(0) + 1;
            } else {
                String finalTitle = request.title() != null ? request.title() : "Untitled Course";
                if (existingPathOpt.isPresent() && "KEEP_BOTH".equals(strategy)) {
                    finalTitle = finalTitle + " (Imported)";
                }

                path = Path.builder()
                        .title(finalTitle)
                        .description(request.description() != null ? request.description() : "")
                        .category(request.category() != null ? request.category() : "Backend")
                        .managedBy(request.managedBy() != null ? request.managedBy() : "learnNow")
                        .status(ContentStatus.DRAFT)
                        .build();
                startOrderIndex = 1;
            }
        }

        int topicCount = 0;
        int subtopicCount = 0;
        int questionCount = 0;

        if (request.topics() != null) {
            int tIdx = startOrderIndex;
            for (ImportCourseRequest.ImportTopicRequest tReq : request.topics()) {
                if (tReq.title() == null || tReq.title().isBlank()) continue;
                final String origTTitle = tReq.title().trim();
                String tTitle = origTTitle;

                java.util.Optional<Topic> existingTopicOpt = path.getTopics().stream()
                        .filter(t -> t.getTitle() != null && t.getTitle().equalsIgnoreCase(origTTitle))
                        .findFirst();

                if (existingTopicOpt.isPresent()) {
                    if ("SKIP_EXISTING".equals(strategy)) {
                        continue;
                    }
                    if ("KEEP_BOTH".equals(strategy)) {
                        tTitle = tTitle + " (Imported)";
                    }
                }

                Topic topic;
                if (existingTopicOpt.isPresent() && "OVERWRITE".equals(strategy)) {
                    topic = existingTopicOpt.get();
                    if (tReq.description() != null) topic.setDescription(tReq.description());
                    if (tReq.duration() != null) topic.setDuration(tReq.duration());
                } else {
                    topicCount++;
                    topic = Topic.builder()
                            .title(tTitle)
                            .description(tReq.description())
                            .category(tReq.category() != null ? tReq.category() : "course")
                            .duration(tReq.duration() != null ? tReq.duration() : "1 hour")
                            .orderIndex(tIdx++)
                            .status(ContentStatus.DRAFT)
                            .path(path)
                            .build();
                    path.getTopics().add(topic);
                }

                if (tReq.subtopics() != null) {
                    int stIdx = topic.getSubtopics().stream()
                            .mapToInt(Subtopic::getOrderIndex)
                            .max().orElse(0) + 1;

                    for (ImportCourseRequest.ImportSubtopicRequest stReq : tReq.subtopics()) {
                        if (stReq.title() == null || stReq.title().isBlank()) continue;
                        final String origStTitle = stReq.title().trim();
                        String stTitle = origStTitle;

                        java.util.Optional<Subtopic> existingSubOpt = topic.getSubtopics().stream()
                                .filter(st -> st.getTitle() != null && st.getTitle().equalsIgnoreCase(origStTitle))
                                .findFirst();

                        if (existingSubOpt.isPresent()) {
                            if ("SKIP_EXISTING".equals(strategy)) {
                                continue;
                            }
                            if ("KEEP_BOTH".equals(strategy)) {
                                stTitle = stTitle + " (Imported)";
                            }
                        }

                        Subtopic subtopic;
                        if (existingSubOpt.isPresent() && "OVERWRITE".equals(strategy)) {
                            subtopic = existingSubOpt.get();
                            subtopic.setContent(stReq.content());
                            subtopic.getBlocks().clear();
                        } else {
                            subtopicCount++;
                            subtopic = Subtopic.builder()
                                    .title(stTitle)
                                    .content(stReq.content())
                                    .orderIndex(stIdx++)
                                    .status(ContentStatus.DRAFT)
                                    .version(1)
                                    .topic(topic)
                                    .build();
                            topic.getSubtopics().add(subtopic);
                        }

                        if (stReq.questions() != null && !stReq.questions().isEmpty()) {
                            ContentBlock block = ContentBlock.builder()
                                    .subtopic(subtopic)
                                    .type("quiz")
                                    .orderIndex(1)
                                    .build();

                            List<QuizQuestion> questions = new java.util.ArrayList<>();
                            for (ImportCourseRequest.ImportQuestionRequest qReq : stReq.questions()) {
                                questionCount++;
                                String optionsJson = "[]";
                                if (qReq.options() != null) {
                                    try {
                                        optionsJson = objectMapper.writeValueAsString(qReq.options());
                                    } catch (Exception ignored) {}
                                }
                                QuizQuestion q = QuizQuestion.builder()
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
                    }
                }
            }
        }

        Path saved = pathRepository.save(path);

        return new ImportResultDto(
                saved.getId(),
                saved.getTitle(),
                topicCount,
                subtopicCount,
                questionCount,
                saved.getStatus().name(),
                isAppend ? "APPENDED" : "CREATED"
        );
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
                                                    optsList = objectMapper.readValue(
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
