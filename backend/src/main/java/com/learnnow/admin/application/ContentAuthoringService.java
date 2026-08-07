package com.learnnow.admin.application;

import com.learnnow.admin.api.dto.*;
import com.learnnow.admin.persistence.*;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.paths.dao.PathDao;
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
    private final PathDao pathDao;
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
        return pathDao.findAllWithTopics().stream()
                .map(this::toAdminPathSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.Optional<AdminPathDto> getAdminPathById(UUID pathId) {
        return pathDao.findFullAdminPathById(pathId)
                .map(this::toAdminPathDto);
    }

    @Transactional
    public AdminPathDto saveOrUpdatePath(AdminPathDto request) {
        Path path;
        if (request.id() != null && pathRepository.existsById(request.id())) {
            path = pathDao.findFullAdminPathById(request.id())
                    .orElseGet(() -> pathRepository.findById(request.id()).orElseThrow());
        } else {
            path = new Path();
        }

        path.setTitle(request.title());
        path.setDescription(request.description());
        path.setCategory(request.category() != null ? request.category() : "Backend");
        path.setManagedBy(request.managedBy() != null ? request.managedBy() : "learnNow");
        path.setStatus(parseStatus(request.status()));

        if (request.topics() != null) {
            java.util.Map<UUID, Topic> existingTopicsMap = new java.util.HashMap<>();
            if (path.getTopics() != null) {
                for (Topic t : path.getTopics()) {
                    if (t.getId() != null) {
                        existingTopicsMap.put(t.getId(), t);
                    }
                }
            }

            java.util.List<Topic> updatedTopicsList = new java.util.ArrayList<>();
            int tIdx = 1;

            for (AdminPathDto.AdminTopicDto topicReq : request.topics()) {
                Topic topic;
                if (topicReq.id() != null && existingTopicsMap.containsKey(topicReq.id())) {
                    topic = existingTopicsMap.remove(topicReq.id());
                } else {
                    topic = new Topic();
                    topic.setPath(path);
                }

                topic.setTitle(topicReq.title());
                topic.setDescription(topicReq.description());
                topic.setCategory(topicReq.category() != null ? topicReq.category() : "Topic");
                topic.setDuration(topicReq.duration() != null ? topicReq.duration() : "1 hour");
                topic.setOrderIndex(topicReq.orderIndex() > 0 ? topicReq.orderIndex() : tIdx++);
                topic.setStatus(parseStatus(topicReq.status()));

                if (topicReq.subtopics() != null) {
                    java.util.Map<UUID, Subtopic> existingSubtopicsMap = new java.util.HashMap<>();
                    if (topic.getSubtopics() != null) {
                        for (Subtopic st : topic.getSubtopics()) {
                            if (st.getId() != null) {
                                existingSubtopicsMap.put(st.getId(), st);
                            }
                        }
                    }

                    java.util.List<Subtopic> updatedSubtopicsList = new java.util.ArrayList<>();
                    int stIdx = 1;

                    for (AdminPathDto.AdminSubtopicDto stReq : topicReq.subtopics()) {
                        String prereqsJson = "[]";
                        if (stReq.prerequisites() != null) {
                            try {
                                prereqsJson = objectMapper.writeValueAsString(stReq.prerequisites());
                            } catch (Exception ignored) {}
                        }

                        Subtopic subtopic;
                        if (stReq.id() != null && existingSubtopicsMap.containsKey(stReq.id())) {
                            subtopic = existingSubtopicsMap.remove(stReq.id());
                        } else {
                            subtopic = new Subtopic();
                            subtopic.setTopic(topic);
                        }

                        subtopic.setTitle(stReq.title());
                        subtopic.setContent(stReq.content());
                        subtopic.setOrderIndex(stReq.orderIndex() > 0 ? stReq.orderIndex() : stIdx++);
                        subtopic.setStatus(parseStatus(stReq.status()));
                        subtopic.setLevel(stReq.level() != null ? stReq.level() : "beginner");
                        subtopic.setTrack(stReq.track() != null ? stReq.track() : "concept");
                        subtopic.setPrerequisites(prereqsJson);
                        subtopic.setVideoUrl(stReq.videoUrl());
                        subtopic.setEstimatedMinutes(stReq.estimatedMinutes() != null && stReq.estimatedMinutes() > 0 ? stReq.estimatedMinutes() : 5);

                        // Code Snippets in-place update
                        if (stReq.codeSnippets() != null) {
                            java.util.Map<String, SubtopicCodeSnippet> existingSnippetsMap = new java.util.HashMap<>();
                            if (subtopic.getCodeSnippets() != null) {
                                for (SubtopicCodeSnippet sn : subtopic.getCodeSnippets()) {
                                    if (sn.getId() != null) {
                                        existingSnippetsMap.put(sn.getId(), sn);
                                    }
                                }
                            }
                            java.util.List<SubtopicCodeSnippet> updatedSnippetsList = new java.util.ArrayList<>();
                            int snIdx = 1;
                            for (AdminPathDto.AdminCodeSnippetDto snReq : stReq.codeSnippets()) {
                                String snId = snReq.id() != null ? snReq.id() : "snippet-" + snIdx;
                                SubtopicCodeSnippet snippet;
                                if (existingSnippetsMap.containsKey(snId)) {
                                    snippet = existingSnippetsMap.remove(snId);
                                } else {
                                    snippet = new SubtopicCodeSnippet();
                                    snippet.setSubtopic(subtopic);
                                    snippet.setId(snId);
                                }
                                snippet.setLanguage(snReq.language() != null ? snReq.language() : "javascript");
                                snippet.setLabel(snReq.label());
                                snippet.setCode(snReq.code() != null ? snReq.code() : "");
                                snippet.setExpectedOutput(snReq.expectedOutput());
                                snippet.setRunnable(snReq.runnable() == null || snReq.runnable());
                                snippet.setEditable(snReq.editable() == null || snReq.editable());
                                snippet.setOrderIndex(snReq.orderIndex() != null ? snReq.orderIndex() : snIdx++);
                                updatedSnippetsList.add(snippet);
                            }
                            if (subtopic.getCodeSnippets() == null) {
                                subtopic.setCodeSnippets(new java.util.ArrayList<>());
                            }
                            subtopic.getCodeSnippets().clear();
                            subtopic.getCodeSnippets().addAll(updatedSnippetsList);
                        }

                        // Quiz Questions in-place update
                        if (stReq.questions() != null) {
                            ContentBlock quizBlock = subtopic.getBlocks() != null ? subtopic.getBlocks().stream()
                                    .filter(b -> "quiz".equalsIgnoreCase(b.getType()))
                                    .findFirst()
                                    .orElse(null) : null;

                            if (quizBlock == null) {
                                quizBlock = ContentBlock.builder()
                                        .subtopic(subtopic)
                                        .type("quiz")
                                        .orderIndex(1)
                                        .build();
                                if (subtopic.getBlocks() == null) {
                                    subtopic.setBlocks(new java.util.ArrayList<>());
                                }
                                subtopic.getBlocks().add(quizBlock);
                            }

                            java.util.Map<UUID, QuizQuestion> existingQuestionsMap = new java.util.HashMap<>();
                            if (quizBlock.getQuestions() != null) {
                                for (QuizQuestion q : quizBlock.getQuestions()) {
                                    if (q.getId() != null) {
                                        existingQuestionsMap.put(q.getId(), q);
                                    }
                                }
                            }
                            java.util.List<QuizQuestion> updatedQuestionsList = new java.util.ArrayList<>();
                            for (AdminPathDto.AdminQuizQuestionDto qReq : stReq.questions()) {
                                String optionsJson = "[]";
                                if (qReq.options() != null) {
                                    try {
                                        optionsJson = objectMapper.writeValueAsString(qReq.options());
                                    } catch (Exception ignored) {}
                                }
                                QuizQuestion q;
                                if (qReq.id() != null && existingQuestionsMap.containsKey(qReq.id())) {
                                    q = existingQuestionsMap.remove(qReq.id());
                                } else {
                                    q = new QuizQuestion();
                                    q.setBlock(quizBlock);
                                }
                                q.setKind(qReq.kind() != null ? qReq.kind() : "mcq");
                                q.setPrompt(qReq.prompt());
                                q.setOptions(optionsJson);
                                q.setCorrectAnswer(qReq.correctAnswer() != null ? qReq.correctAnswer() : "");
                                q.setExplanation(qReq.explanation());
                                q.setPoints(qReq.points() > 0 ? qReq.points() : 5);
                                updatedQuestionsList.add(q);
                            }
                            if (quizBlock.getQuestions() == null) {
                                quizBlock.setQuestions(new java.util.ArrayList<>());
                            }
                            quizBlock.getQuestions().clear();
                            quizBlock.getQuestions().addAll(updatedQuestionsList);
                        }

                        updatedSubtopicsList.add(subtopic);
                    }

                    if (topic.getSubtopics() == null) {
                        topic.setSubtopics(new java.util.ArrayList<>());
                    }
                    topic.getSubtopics().clear();
                    topic.getSubtopics().addAll(updatedSubtopicsList);
                }

                updatedTopicsList.add(topic);
            }

            if (path.getTopics() == null) {
                path.setTopics(new java.util.ArrayList<>());
            }
            path.getTopics().clear();
            path.getTopics().addAll(updatedTopicsList);
        }

        Path saved = pathRepository.save(path);
        return getAdminPathById(saved.getId()).orElseThrow();
    }

    @Transactional
    public void deletePath(UUID pathId) {
        if (!pathRepository.existsById(pathId)) {
            throw new com.learnnow.common.exception.NotFoundException("Path not found with id: " + pathId);
        }
        pathRepository.deleteById(pathId);
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

                        String prereqsJson = "[]";
                        if (stReq.prerequisites() != null) {
                            try {
                                prereqsJson = objectMapper.writeValueAsString(stReq.prerequisites());
                            } catch (Exception ignored) {}
                        }

                        Subtopic subtopic;
                        if (existingSubOpt.isPresent() && "OVERWRITE".equals(strategy)) {
                            subtopic = existingSubOpt.get();
                            subtopic.setContent(stReq.content());
                            subtopic.setLevel(stReq.level() != null ? stReq.level() : "beginner");
                            subtopic.setTrack(stReq.track() != null ? stReq.track() : "concept");
                            subtopic.setPrerequisites(prereqsJson);
                            subtopic.setVideoUrl(stReq.videoUrl());
                            subtopic.setEstimatedMinutes(stReq.estimatedMinutes() != null && stReq.estimatedMinutes() > 0 ? stReq.estimatedMinutes() : 5);
                            subtopic.getBlocks().clear();
                            subtopic.getCodeSnippets().clear();
                        } else {
                            subtopicCount++;
                            subtopic = Subtopic.builder()
                                    .title(stTitle)
                                    .content(stReq.content())
                                    .orderIndex(stIdx++)
                                    .status(ContentStatus.DRAFT)
                                    .version(1)
                                    .level(stReq.level() != null ? stReq.level() : "beginner")
                                    .track(stReq.track() != null ? stReq.track() : "concept")
                                    .prerequisites(prereqsJson)
                                    .videoUrl(stReq.videoUrl())
                                    .estimatedMinutes(stReq.estimatedMinutes() != null && stReq.estimatedMinutes() > 0 ? stReq.estimatedMinutes() : 5)
                                    .topic(topic)
                                    .build();
                            topic.getSubtopics().add(subtopic);
                        }

                        if (stReq.codeSnippets() != null && !stReq.codeSnippets().isEmpty()) {
                            java.util.List<SubtopicCodeSnippet> snippets = new java.util.ArrayList<>();
                            int snIdx = 1;
                            for (ImportCourseRequest.ImportCodeSnippetRequest snReq : stReq.codeSnippets()) {
                                SubtopicCodeSnippet snippet = SubtopicCodeSnippet.builder()
                                        .subtopic(subtopic)
                                        .id(snReq.id() != null ? snReq.id() : "snippet-" + snIdx)
                                        .language(snReq.language() != null ? snReq.language() : "javascript")
                                        .label(snReq.label())
                                        .code(snReq.code() != null ? snReq.code() : "")
                                        .expectedOutput(snReq.expectedOutput())
                                        .runnable(snReq.runnable() == null || snReq.runnable())
                                        .editable(snReq.editable() == null || snReq.editable())
                                        .orderIndex(snReq.orderIndex() != null ? snReq.orderIndex() : snIdx++)
                                        .build();
                                snippets.add(snippet);
                            }
                            subtopic.setCodeSnippets(snippets);
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

                                List<String> prereqs = List.of();
                                if (st.getPrerequisites() != null) {
                                    try {
                                        prereqs = objectMapper.readValue(
                                                st.getPrerequisites(),
                                                new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                                        );
                                    } catch (Exception ignored) {}
                                }

                                List<AdminPathDto.AdminCodeSnippetDto> snippets = st.getCodeSnippets() != null ? st.getCodeSnippets().stream()
                                        .sorted(java.util.Comparator.comparingInt(SubtopicCodeSnippet::getOrderIndex))
                                        .map(sn -> new AdminPathDto.AdminCodeSnippetDto(
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

                                return new AdminPathDto.AdminSubtopicDto(
                                        st.getId(),
                                        st.getTitle(),
                                        st.getContent(),
                                        st.getOrderIndex(),
                                        st.getStatus() != null ? st.getStatus().name() : "DRAFT",
                                        st.getLevel() != null ? st.getLevel() : "beginner",
                                        st.getTrack() != null ? st.getTrack() : "concept",
                                        prereqs,
                                        st.getVideoUrl(),
                                        st.getEstimatedMinutes() > 0 ? st.getEstimatedMinutes() : 5,
                                        snippets,
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

    private AdminPathDto toAdminPathSummaryDto(Path path) {
        List<AdminPathDto.AdminTopicDto> topics = path.getTopics().stream()
                .sorted(java.util.Comparator.comparingInt(t -> t.getOrderIndex() != null ? t.getOrderIndex() : 0))
                .map(t -> new AdminPathDto.AdminTopicDto(
                        t.getId(),
                        t.getTitle(),
                        t.getDescription(),
                        t.getCategory(),
                        t.getDuration(),
                        t.getOrderIndex() != null ? t.getOrderIndex() : 1,
                        t.getStatus() != null ? t.getStatus().name() : "DRAFT",
                        List.of()
                )).toList();

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
