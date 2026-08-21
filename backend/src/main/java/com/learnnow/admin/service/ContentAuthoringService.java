package com.learnnow.admin.service;

import com.learnnow.admin.dto.request.*;
import com.learnnow.admin.dto.response.*;
import com.learnnow.admin.entity.*;
import com.learnnow.admin.repository.*;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.paths.dao.PathDao;
import com.learnnow.paths.entity.*;
import com.learnnow.paths.repository.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContentAuthoringService {

    private static final String STRATEGY_FAIL_ON_CONFLICT = "FAIL_ON_CONFLICT";
    private static final String STRATEGY_OVERWRITE = "OVERWRITE";
    private static final String STRATEGY_KEEP_BOTH = "KEEP_BOTH";
    private static final String STRATEGY_SKIP_EXISTING = "SKIP_EXISTING";
    private static final String DEFAULT_CATEGORY_PATH = "General";
    private static final String DEFAULT_MANAGED_BY = "learnNow";
    private static final String DEFAULT_CATEGORY_BACKEND = "Backend";
    private static final String DEFAULT_CATEGORY_TOPIC = "course";
    private static final String DEFAULT_DURATION_TOPIC = "1 hour";
    private static final String DEFAULT_LEVEL_SUBTOPIC = "beginner";
    private static final String DEFAULT_TRACK_SUBTOPIC = "concept";
    private static final String DEFAULT_SNIPPET_LANGUAGE = "javascript";
    private static final int DEFAULT_ESTIMATED_MINUTES = 5;
    private static final int DEFAULT_QUESTION_POINTS = 5;

    private static class ImportCounts {
        int topics = 0;
        int subtopics = 0;
        int questions = 0;
    }

    private final PathRepository pathRepository;
    private final PathDao pathDao;
    private final TopicRepository topicRepository;
    private final PathTopicRepository pathTopicRepository;
    private final SubtopicRepository subtopicRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final MessageSource messageSource;

    @Transactional
    public Path createPath(CreatePathRequest request) {
        Path path =
                Path.builder()
                        .title(request.title())
                        .description(request.description())
                        .category(
                                request.category() != null
                                        ? request.category()
                                        : DEFAULT_CATEGORY_PATH)
                        .managedBy(
                                request.managedBy() != null
                                        ? request.managedBy()
                                        : DEFAULT_MANAGED_BY)
                        .status(ContentStatus.DRAFT)
                        .build();
        return pathRepository.save(path);
    }

    @Transactional
    public Topic createTopic(UUID pathId, CreateTopicRequest request) {
        Path path =
                pathRepository
                        .findById(pathId)
                        .orElseThrow(() -> new NotFoundException("path_not_found"));

        Topic topic =
                Topic.builder()
                        .title(request.title())
                        .description(request.description())
                        .category(request.category() != null ? request.category() : "course")
                        .duration(request.duration() != null ? request.duration() : "1 hour")
                        .status(ContentStatus.DRAFT)
                        .build();
        Topic saved = topicRepository.save(topic);

        // Membership is the join row. There is no owning-path column to set.
        int nextIndex = path.getPathTopics() != null ? path.getPathTopics().size() + 1 : 1;
        pathTopicRepository.save(
                PathTopic.builder()
                        .id(new PathTopicId(path.getId(), saved.getId()))
                        .path(path)
                        .topic(saved)
                        .orderIndex(nextIndex)
                        .build());

        return saved;
    }

    @Transactional
    public Subtopic createSubtopic(UUID topicId, CreateSubtopicRequest request) {
        Topic topic =
                topicRepository
                        .findById(topicId)
                        .orElseThrow(() -> new NotFoundException("topic_not_found"));

        Subtopic subtopic =
                Subtopic.builder()
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
        Subtopic subtopic =
                subtopicRepository
                        .findById(subtopicId)
                        .orElseThrow(() -> new NotFoundException("subtopic_not_found"));

        ContentBlock block =
                ContentBlock.builder()
                        .subtopic(subtopic)
                        .orderIndex(request.orderIndex())
                        .type(request.type())
                        .body(request.body())
                        .build();
        ContentBlock savedBlock = contentBlockRepository.save(block);

        if (request.questions() != null && !request.questions().isEmpty()) {
            List<QuizQuestion> questions =
                    request.questions().stream()
                            .map(
                                    q ->
                                            QuizQuestion.builder()
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
        return pathDao.findAllWithTopics().stream().map(this::toAdminPathSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<AdminPathDto> getAdminPathById(UUID pathId) {
        return pathDao.findFullAdminPathById(pathId).map(this::toAdminPathDto);
    }

    @Transactional
    public AdminPathDto saveOrUpdatePath(AdminPathDto request) {
        Path path;
        if (request.id() != null && pathRepository.existsById(request.id())) {
            path =
                    pathDao.findFullAdminPathById(request.id())
                            .orElseGet(() -> pathRepository.findById(request.id()).orElseThrow());
        } else {
            path = new Path();
        }

        path.setTitle(request.title());
        path.setDescription(request.description());
        path.setCategory(
                request.category() != null ? request.category() : DEFAULT_CATEGORY_BACKEND);
        path.setManagedBy(request.managedBy() != null ? request.managedBy() : DEFAULT_MANAGED_BY);
        path.setStatus(parseStatus(request.status()));
        Path savedPath = pathRepository.save(path);

        if (request.topics() != null) {
            Map<UUID, PathTopic> existingPathTopicsMap = new HashMap<>();
            if (savedPath.getPathTopics() != null) {
                for (PathTopic pt : savedPath.getPathTopics()) {
                    if (pt.getTopic() != null && pt.getTopic().getId() != null) {
                        existingPathTopicsMap.put(pt.getTopic().getId(), pt);
                    }
                }
            }

            List<PathTopic> updatedPathTopicsList = new ArrayList<>();
            int tIdx = 1;

            for (AdminPathDto.AdminTopicDto topicReq : request.topics()) {
                Topic topic;
                if (topicReq.id() != null && topicRepository.existsById(topicReq.id())) {
                    topic = topicRepository.findById(topicReq.id()).orElseThrow();
                } else {
                    topic = new Topic();
                }

                topic.setTitle(topicReq.title());
                topic.setDescription(topicReq.description());
                topic.setCategory(topicReq.category() != null ? topicReq.category() : "Topic");
                topic.setDuration(topicReq.duration() != null ? topicReq.duration() : "1 hour");
                topic.setStatus(parseStatus(topicReq.status()));

                if (topicReq.subtopics() != null) {
                    Map<UUID, Subtopic> existingSubtopicsMap = new HashMap<>();
                    if (topic.getSubtopics() != null) {
                        for (Subtopic st : topic.getSubtopics()) {
                            if (st.getId() != null) {
                                existingSubtopicsMap.put(st.getId(), st);
                            }
                        }
                    }

                    List<Subtopic> updatedSubtopicsList = new ArrayList<>();
                    for (AdminPathDto.AdminSubtopicDto stReq : topicReq.subtopics()) {
                        String prereqsJson =
                                serializeStringList(stReq.prerequisites(), "prerequisites");

                        Subtopic subtopic;
                        if (stReq.id() != null && existingSubtopicsMap.containsKey(stReq.id())) {
                            subtopic = existingSubtopicsMap.remove(stReq.id());
                        } else {
                            subtopic = new Subtopic();
                            subtopic.setTopic(topic);
                        }

                        subtopic.setTitle(stReq.title());
                        subtopic.setContent(stReq.content());
                        subtopic.setOrderIndex(stReq.orderIndex());
                        subtopic.setStatus(parseStatus(stReq.status()));
                        subtopic.setLevel(stReq.level() != null ? stReq.level() : "beginner");
                        subtopic.setTrack(stReq.track() != null ? stReq.track() : "concept");
                        subtopic.setPrerequisites(prereqsJson);
                        subtopic.setVideoUrl(stReq.videoUrl());
                        if (stReq.codeSnippets() != null) {
                            Map<String, SubtopicCodeSnippet> existingSnippetsMap = new HashMap<>();
                            if (subtopic.getCodeSnippets() != null) {
                                for (SubtopicCodeSnippet sn : subtopic.getCodeSnippets()) {
                                    if (sn.getId() != null) {
                                        existingSnippetsMap.put(sn.getId(), sn);
                                    }
                                }
                            }
                            List<SubtopicCodeSnippet> updatedSnippetsList = new ArrayList<>();
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
                                snippet.setLanguage(
                                        snReq.language() != null ? snReq.language() : "javascript");
                                snippet.setLabel(snReq.label());
                                snippet.setCode(snReq.code() != null ? snReq.code() : "");
                                snippet.setExpectedOutput(snReq.expectedOutput());
                                snippet.setRunnable(snReq.runnable() == null || snReq.runnable());
                                snippet.setEditable(snReq.editable() == null || snReq.editable());
                                snippet.setOrderIndex(
                                        snReq.orderIndex() != null ? snReq.orderIndex() : snIdx++);
                                updatedSnippetsList.add(snippet);
                            }
                            if (subtopic.getCodeSnippets() == null) {
                                subtopic.setCodeSnippets(new ArrayList<>());
                            }
                            subtopic.getCodeSnippets().clear();
                            subtopic.getCodeSnippets().addAll(updatedSnippetsList);
                        }

                        // Quiz Questions in-place update
                        if (stReq.questions() != null) {
                            ContentBlock quizBlock =
                                    subtopic.getBlocks() != null
                                            ? subtopic.getBlocks().stream()
                                                    .filter(
                                                            b ->
                                                                    "quiz"
                                                                            .equalsIgnoreCase(
                                                                                    b.getType()))
                                                    .findFirst()
                                                    .orElse(null)
                                            : null;

                            if (quizBlock == null) {
                                quizBlock =
                                        ContentBlock.builder()
                                                .subtopic(subtopic)
                                                .type("quiz")
                                                .orderIndex(1)
                                                .build();
                                if (subtopic.getBlocks() == null) {
                                    subtopic.setBlocks(new ArrayList<>());
                                }
                                subtopic.getBlocks().add(quizBlock);
                            }

                            Map<UUID, QuizQuestion> existingQuestionsMap = new HashMap<>();
                            if (quizBlock.getQuestions() != null) {
                                for (QuizQuestion q : quizBlock.getQuestions()) {
                                    if (q.getId() != null) {
                                        existingQuestionsMap.put(q.getId(), q);
                                    }
                                }
                            }
                            List<QuizQuestion> updatedQuestionsList = new ArrayList<>();
                            for (AdminPathDto.AdminQuizQuestionDto qReq : stReq.questions()) {
                                // A question with no prompt cannot be stored - the column is
                                // NOT NULL - and letting it through aborted the entire batch
                                // with an opaque JDBC error naming only one row. Skipping it
                                // keeps the rest of the course importable and says which one
                                // was dropped.
                                if (qReq.prompt() == null || qReq.prompt().isBlank()) {
                                    log.warn(
                                            "Skipping quiz question with no prompt in subtopic"
                                                    + " '{}' (answer: '{}')",
                                            stReq.title(),
                                            qReq.correctAnswer());
                                    continue;
                                }
                                String optionsJson =
                                        serializeStringList(qReq.options(), "quiz options");
                                QuizQuestion q;
                                if (qReq.id() != null
                                        && existingQuestionsMap.containsKey(qReq.id())) {
                                    q = existingQuestionsMap.remove(qReq.id());
                                } else {
                                    q = new QuizQuestion();
                                    q.setBlock(quizBlock);
                                }
                                q.setKind(
                                        resolveQuestionKind(
                                                qReq.kind(), qReq.options(), qReq.correctAnswer()));
                                q.setPrompt(qReq.prompt());
                                q.setOptions(optionsJson);
                                q.setCorrectAnswer(
                                        qReq.correctAnswer() != null ? qReq.correctAnswer() : "");
                                q.setExplanation(qReq.explanation());
                                q.setPoints(qReq.points() > 0 ? qReq.points() : 5);
                                updatedQuestionsList.add(q);
                            }
                            if (quizBlock.getQuestions() == null) {
                                quizBlock.setQuestions(new ArrayList<>());
                            }
                            quizBlock.getQuestions().clear();
                            quizBlock.getQuestions().addAll(updatedQuestionsList);
                        }

                        updatedSubtopicsList.add(subtopic);
                    }

                    if (topic.getSubtopics() == null) {
                        topic.setSubtopics(new ArrayList<>());
                    }
                    topic.getSubtopics().clear();
                    topic.getSubtopics().addAll(updatedSubtopicsList);
                }

                Topic savedTopic = topicRepository.save(topic);

                PathTopic pathTopic;
                if (existingPathTopicsMap.containsKey(savedTopic.getId())) {
                    pathTopic = existingPathTopicsMap.remove(savedTopic.getId());
                    pathTopic.setOrderIndex(
                            topicReq.orderIndex() > 0 ? topicReq.orderIndex() : tIdx++);
                } else {
                    pathTopic =
                            PathTopic.builder()
                                    .id(new PathTopicId(savedPath.getId(), savedTopic.getId()))
                                    .path(savedPath)
                                    .topic(savedTopic)
                                    .orderIndex(
                                            topicReq.orderIndex() > 0
                                                    ? topicReq.orderIndex()
                                                    : tIdx++)
                                    .build();
                }

                updatedPathTopicsList.add(pathTopic);
            }

            if (savedPath.getPathTopics() == null) {
                savedPath.setPathTopics(new ArrayList<>());
            }
            savedPath.getPathTopics().clear();
            savedPath.getPathTopics().addAll(updatedPathTopicsList);

            savedPath = pathRepository.save(savedPath);
        }

        return toAdminPathDto(savedPath);
    }

    @Transactional
    public void deletePath(UUID pathId) {
        if (!pathRepository.existsById(pathId)) {
            throw new com.learnnow.common.exception.NotFoundException("path_not_found");
        }
        // Native SQL DELETE lets PostgreSQL ON DELETE CASCADE handle the entire
        // entity tree in a single round-trip, avoiding Hibernate's N+1 cascade
        // loading storm (which loads every child entity before deleting).
        pathDao.deletePathNative(pathId);
    }

    @Transactional(readOnly = true)
    public List<AdminPathDto.AdminTopicDto> getAllAdminTopics() {
        return topicRepository.findAll().stream().map(this::toAdminTopicDto).toList();
    }

    @Transactional
    public void attachTopicToPath(UUID pathId, UUID topicId, Integer orderIndex) {
        Path path =
                pathRepository
                        .findById(pathId)
                        .orElseThrow(
                                () ->
                                        new com.learnnow.common.exception.NotFoundException(
                                                "path_not_found"));
        Topic topic =
                topicRepository
                        .findById(topicId)
                        .orElseThrow(
                                () ->
                                        new com.learnnow.common.exception.NotFoundException(
                                                "topic_not_found"));

        int index =
                (orderIndex != null && orderIndex > 0)
                        ? orderIndex
                        : (path.getPathTopics() != null ? path.getPathTopics().size() + 1 : 1);

        PathTopic pathTopic =
                PathTopic.builder()
                        .id(new PathTopicId(pathId, topicId))
                        .path(path)
                        .topic(topic)
                        .orderIndex(index)
                        .build();
        pathTopicRepository.save(pathTopic);
    }

    @Transactional
    public void unlinkTopicFromPath(UUID pathId, UUID topicId) {
        pathTopicRepository.deleteByIdPathIdAndIdTopicId(pathId, topicId);
    }

    @Transactional(readOnly = true)
    public ImportValidationResultDto validateImportConflicts(ImportCourseRequest request) {
        List<ImportConflictItemDto> conflicts = new ArrayList<>();

        if (request.pathId() == null) {
            // CREATE mode: check if path with same title exists
            if (request.title() != null && !request.title().isBlank()) {
                pathRepository
                        .findByTitleIgnoreCase(request.title().trim())
                        .ifPresent(
                                p -> {
                                    String msg =
                                            messageSource.getMessage(
                                                    "path_conflict_message",
                                                    new Object[] {p.getTitle()},
                                                    p.getTitle() + " already exists.",
                                                    LocaleContextHolder.getLocale());
                                    conflicts.add(
                                            new ImportConflictItemDto(
                                                    "PATH", p.getTitle(), p.getId(), msg));
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
                            .filter(
                                    t ->
                                            t.getTitle() != null
                                                    && t.getTitle().equalsIgnoreCase(tTitle))
                            .findFirst()
                            .ifPresent(
                                    existingTopic -> {
                                        String msg =
                                                messageSource.getMessage(
                                                        "topic_conflict_message",
                                                        new Object[] {
                                                            existingTopic.getTitle(),
                                                            existingPath.getTitle()
                                                        },
                                                        existingTopic.getTitle()
                                                                + " already exists.",
                                                        LocaleContextHolder.getLocale());
                                        conflicts.add(
                                                new ImportConflictItemDto(
                                                        "TOPIC",
                                                        existingTopic.getTitle(),
                                                        existingTopic.getId(),
                                                        msg));

                                        if (tReq.subtopics() != null) {
                                            for (ImportCourseRequest.ImportSubtopicRequest stReq :
                                                    tReq.subtopics()) {
                                                if (stReq.title() == null
                                                        || stReq.title().isBlank()) continue;
                                                String stTitle = stReq.title().trim();

                                                existingTopic.getSubtopics().stream()
                                                        .filter(
                                                                st ->
                                                                        st.getTitle() != null
                                                                                && st.getTitle()
                                                                                        .equalsIgnoreCase(
                                                                                                stTitle))
                                                        .findFirst()
                                                        .ifPresent(
                                                                existingSub -> {
                                                                    String subMsg =
                                                                            messageSource
                                                                                    .getMessage(
                                                                                            "subtopic_conflict_message",
                                                                                            new Object
                                                                                                    [] {
                                                                                                existingSub
                                                                                                        .getTitle(),
                                                                                                existingTopic
                                                                                                        .getTitle()
                                                                                            },
                                                                                            existingSub
                                                                                                            .getTitle()
                                                                                                    + " already"
                                                                                                    + " exists.",
                                                                                            LocaleContextHolder
                                                                                                    .getLocale());
                                                                    conflicts.add(
                                                                            new ImportConflictItemDto(
                                                                                    "SUBTOPIC",
                                                                                    existingSub
                                                                                            .getTitle(),
                                                                                    existingSub
                                                                                            .getId(),
                                                                                    subMsg));
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
        String strategy =
                request.conflictStrategy() != null && !request.conflictStrategy().isBlank()
                        ? request.conflictStrategy().toUpperCase()
                        : STRATEGY_FAIL_ON_CONFLICT;

        // Pre-check for conflicts if default strategy or explicitly requested
        if (STRATEGY_FAIL_ON_CONFLICT.equals(strategy)) {
            ImportValidationResultDto validation = validateImportConflicts(request);
            if (validation.hasConflicts()) {
                String firstMsg = validation.conflicts().get(0).message();
                throw new com.learnnow.common.exception.ConflictException(firstMsg);
            }
        }

        if (request.pathId() == null && STRATEGY_FAIL_ON_CONFLICT.equals(strategy)) {
            if (request.title() == null || request.title().isBlank()) {
                throw new com.learnnow.common.exception.ValidationException("path_title_required");
            }
            if (request.description() == null || request.description().isBlank()) {
                throw new com.learnnow.common.exception.ValidationException(
                        "path_description_required");
            }
        }

        boolean isAppend = request.pathId() != null;
        Path path;
        int startOrderIndex;

        if (isAppend) {
            path =
                    pathRepository
                            .findById(request.pathId())
                            .orElseThrow(
                                    () ->
                                            new com.learnnow.common.exception.NotFoundException(
                                                    "path_not_found"));
            startOrderIndex =
                    path.getTopics().stream()
                                    .mapToInt(
                                            t -> t.getOrderIndex() != null ? t.getOrderIndex() : 0)
                                    .max()
                                    .orElse(0)
                            + 1;
        } else {
            Optional<Path> existingPathOpt =
                    (request.title() != null && !request.title().isBlank())
                            ? pathRepository.findByTitleIgnoreCase(request.title().trim())
                            : Optional.empty();

            if (existingPathOpt.isPresent() && STRATEGY_OVERWRITE.equals(strategy)) {
                path = existingPathOpt.get();
                if (request.description() != null) path.setDescription(request.description());
                if (request.category() != null) path.setCategory(request.category());
                startOrderIndex =
                        path.getTopics().stream()
                                        .mapToInt(
                                                t ->
                                                        t.getOrderIndex() != null
                                                                ? t.getOrderIndex()
                                                                : 0)
                                        .max()
                                        .orElse(0)
                                + 1;
            } else {
                String finalTitle = request.title() != null ? request.title() : "Untitled Course";
                if (existingPathOpt.isPresent() && STRATEGY_KEEP_BOTH.equals(strategy)) {
                    finalTitle = finalTitle + " (Imported)";
                }

                path =
                        Path.builder()
                                .title(finalTitle)
                                .description(
                                        request.description() != null ? request.description() : "")
                                .category(
                                        request.category() != null
                                                ? request.category()
                                                : DEFAULT_CATEGORY_BACKEND)
                                .managedBy(
                                        request.managedBy() != null
                                                ? request.managedBy()
                                                : DEFAULT_MANAGED_BY)
                                .status(ContentStatus.DRAFT)
                                .build();
                startOrderIndex = 1;
            }
        }

        ImportCounts counts = new ImportCounts();
        processTopics(request.topics(), path, strategy, startOrderIndex, counts);

        Path saved = pathRepository.save(path);

        return new ImportResultDto(
                saved.getId(),
                saved.getTitle(),
                counts.topics,
                counts.subtopics,
                counts.questions,
                saved.getStatus().name(),
                isAppend ? "APPENDED" : "CREATED");
    }

    private void processTopics(
            List<ImportCourseRequest.ImportTopicRequest> topics,
            Path path,
            String strategy,
            int startOrderIndex,
            ImportCounts counts) {
        if (topics == null) return;
        int tIdx = startOrderIndex;
        for (ImportCourseRequest.ImportTopicRequest tReq : topics) {
            if (tReq.title() == null || tReq.title().isBlank()) continue;
            final String origTTitle = tReq.title().trim();
            String tTitle = origTTitle;

            Optional<Topic> existingTopicOpt =
                    path.getTopics().stream()
                            .filter(
                                    t ->
                                            t.getTitle() != null
                                                    && t.getTitle().equalsIgnoreCase(origTTitle))
                            .findFirst();

            if (existingTopicOpt.isPresent()) {
                if (STRATEGY_SKIP_EXISTING.equals(strategy)) {
                    continue;
                }
                if (STRATEGY_KEEP_BOTH.equals(strategy)) {
                    tTitle = tTitle + " (Imported)";
                }
            }

            Topic topic;
            if (existingTopicOpt.isPresent() && STRATEGY_OVERWRITE.equals(strategy)) {
                topic = existingTopicOpt.get();
                if (tReq.description() != null) topic.setDescription(tReq.description());
                if (tReq.duration() != null) topic.setDuration(tReq.duration());
            } else {
                counts.topics++;
                topic =
                        Topic.builder()
                                .title(tTitle)
                                .description(tReq.description())
                                .category(
                                        tReq.category() != null
                                                ? tReq.category()
                                                : DEFAULT_CATEGORY_TOPIC)
                                .duration(
                                        tReq.duration() != null
                                                ? tReq.duration()
                                                : DEFAULT_DURATION_TOPIC)
                                .orderIndex(tIdx++)
                                .status(ContentStatus.DRAFT)
                                .build();

                // path.getTopics() is a derived, immutable projection - adding to it
                // threw UnsupportedOperationException, so importing a new topic failed
                // at runtime. Membership is recorded on the owning collection instead,
                // which cascades from Path.
                topicRepository.save(topic);
                path.getPathTopics()
                        .add(
                                PathTopic.builder()
                                        .id(new PathTopicId(path.getId(), topic.getId()))
                                        .path(path)
                                        .topic(topic)
                                        .orderIndex(topic.getOrderIndex())
                                        .build());
            }

            processSubtopics(tReq.subtopics(), topic, strategy, counts);
        }
    }

    private void processSubtopics(
            List<ImportCourseRequest.ImportSubtopicRequest> subtopics,
            Topic topic,
            String strategy,
            ImportCounts counts) {
        if (subtopics == null) return;
        int stIdx =
                topic.getSubtopics().stream().mapToInt(Subtopic::getOrderIndex).max().orElse(0) + 1;

        for (ImportCourseRequest.ImportSubtopicRequest stReq : subtopics) {
            if (stReq.title() == null || stReq.title().isBlank()) continue;
            final String origStTitle = stReq.title().trim();
            String stTitle = origStTitle;

            Optional<Subtopic> existingSubOpt =
                    topic.getSubtopics().stream()
                            .filter(
                                    st ->
                                            st.getTitle() != null
                                                    && st.getTitle().equalsIgnoreCase(origStTitle))
                            .findFirst();

            if (existingSubOpt.isPresent()) {
                if (STRATEGY_SKIP_EXISTING.equals(strategy)) {
                    continue;
                }
                if (STRATEGY_KEEP_BOTH.equals(strategy)) {
                    stTitle = stTitle + " (Imported)";
                }
            }

            String prereqsJson = serializePrerequisites(stReq.prerequisites());

            Subtopic subtopic;
            if (existingSubOpt.isPresent() && STRATEGY_OVERWRITE.equals(strategy)) {
                subtopic = existingSubOpt.get();
                subtopic.setContent(stReq.content());
                subtopic.setLevel(stReq.level() != null ? stReq.level() : DEFAULT_LEVEL_SUBTOPIC);
                subtopic.setTrack(stReq.track() != null ? stReq.track() : DEFAULT_TRACK_SUBTOPIC);
                subtopic.setPrerequisites(prereqsJson);
                subtopic.setVideoUrl(stReq.videoUrl());
                subtopic.setEstimatedMinutes(
                        stReq.estimatedMinutes() != null && stReq.estimatedMinutes() > 0
                                ? stReq.estimatedMinutes()
                                : DEFAULT_ESTIMATED_MINUTES);
                subtopic.getBlocks().clear();
                subtopic.getCodeSnippets().clear();
            } else {
                counts.subtopics++;
                subtopic =
                        Subtopic.builder()
                                .title(stTitle)
                                .content(stReq.content())
                                .orderIndex(stIdx++)
                                .status(ContentStatus.DRAFT)
                                .version(1)
                                .level(
                                        stReq.level() != null
                                                ? stReq.level()
                                                : DEFAULT_LEVEL_SUBTOPIC)
                                .track(
                                        stReq.track() != null
                                                ? stReq.track()
                                                : DEFAULT_TRACK_SUBTOPIC)
                                .prerequisites(prereqsJson)
                                .videoUrl(stReq.videoUrl())
                                .estimatedMinutes(
                                        stReq.estimatedMinutes() != null
                                                        && stReq.estimatedMinutes() > 0
                                                ? stReq.estimatedMinutes()
                                                : DEFAULT_ESTIMATED_MINUTES)
                                .topic(topic)
                                .build();
                topic.getSubtopics().add(subtopic);
            }

            processCodeSnippets(stReq.codeSnippets(), subtopic);
            processQuestions(stReq.questions(), subtopic, counts);
        }
    }

    /**
     * Serialises a small string list to JSON for a JSONB column.
     *
     * <p>Failures were previously swallowed and replaced with an empty array, so quiz options and
     * prerequisites could vanish during an import with nothing recorded anywhere. The fallback is
     * kept - one bad field should not abort a whole course import - but it is now visible.
     */
    private String serializeStringList(List<String> values, String fieldName) {
        if (values == null || values.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            log.warn(
                    "Could not serialise {} ({} entries); storing an empty array",
                    fieldName,
                    values.size(),
                    e);
            return "[]";
        }
    }

    private String serializePrerequisites(List<String> prerequisites) {
        return serializeStringList(prerequisites, "prerequisites");
    }

    private void processCodeSnippets(
            List<ImportCourseRequest.ImportCodeSnippetRequest> codeSnippets, Subtopic subtopic) {
        if (codeSnippets == null || codeSnippets.isEmpty()) return;
        List<SubtopicCodeSnippet> snippets = new ArrayList<>();
        int snIdx = 1;
        for (ImportCourseRequest.ImportCodeSnippetRequest snReq : codeSnippets) {
            SubtopicCodeSnippet snippet =
                    SubtopicCodeSnippet.builder()
                            .subtopic(subtopic)
                            .id(snReq.id() != null ? snReq.id() : "snippet-" + snIdx)
                            .language(
                                    snReq.language() != null
                                            ? snReq.language()
                                            : DEFAULT_SNIPPET_LANGUAGE)
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

    private void processQuestions(
            List<ImportCourseRequest.ImportQuestionRequest> questions,
            Subtopic subtopic,
            ImportCounts counts) {
        if (questions == null || questions.isEmpty()) return;
        ContentBlock block =
                ContentBlock.builder().subtopic(subtopic).type("quiz").orderIndex(1).build();

        List<QuizQuestion> quizQuestions = new ArrayList<>();
        for (ImportCourseRequest.ImportQuestionRequest qReq : questions) {
            String prompt = qReq.prompt();
            if (prompt == null || prompt.isBlank()) continue;

            counts.questions++;
            String optionsJson = serializeStringList(qReq.options(), "quiz options");

            String kind = resolveQuestionKind(qReq.kind(), qReq.options(), qReq.correctAnswer());

            QuizQuestion q =
                    QuizQuestion.builder()
                            .block(block)
                            .kind(kind)
                            .prompt(prompt)
                            .options(optionsJson)
                            .correctAnswer(qReq.correctAnswer() != null ? qReq.correctAnswer() : "")
                            .explanation(qReq.explanation())
                            .points(qReq.points() > 0 ? qReq.points() : DEFAULT_QUESTION_POINTS)
                            .build();
            quizQuestions.add(q);
        }
        if (!quizQuestions.isEmpty()) {
            block.setQuestions(quizQuestions);
            subtopic.getBlocks().add(block);
        }
    }

    /**
     * Picks a question kind when the payload omits it.
     *
     * <p>Defaulting to "mcq" produced multiple-choice questions with no choices, which the quiz UI
     * cannot render and the CHECK constraint has no way to catch. Inferring from the shape of the
     * data gives something usable: choices present means multiple choice, a boolean answer means
     * true/false, and anything else is a free-text answer.
     */
    private String resolveQuestionKind(
            String declared, List<String> options, String correctAnswer) {
        if (declared != null && !declared.isBlank()) {
            return declared;
        }
        if (options != null && !options.isEmpty()) {
            return "mcq";
        }
        if (correctAnswer != null
                && ("true".equalsIgnoreCase(correctAnswer.trim())
                        || "false".equalsIgnoreCase(correctAnswer.trim()))) {
            return "true_false";
        }
        return "fill_blank";
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
        List<AdminPathDto.AdminTopicDto> topics =
                path.getTopics().stream().map(this::toAdminTopicDto).toList();

        return new AdminPathDto(
                path.getId(),
                path.getTitle(),
                path.getDescription(),
                path.getCategory(),
                path.getManagedBy(),
                path.getStatus() != null ? path.getStatus().name() : "DRAFT",
                topics);
    }

    private AdminPathDto.AdminTopicDto toAdminTopicDto(Topic t) {
        List<AdminPathDto.AdminSubtopicDto> subtopics =
                t.getSubtopics() != null
                        ? t.getSubtopics().stream()
                                .sorted(Comparator.comparingInt(st -> st.getOrderIndex()))
                                .map(
                                        st -> {
                                            List<AdminPathDto.AdminQuizQuestionDto> questions =
                                                    st.getBlocks() != null
                                                            ? st.getBlocks().stream()
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
                                                                                List<String>
                                                                                        optsList =
                                                                                                List
                                                                                                        .of();
                                                                                if (q.getOptions()
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
                                                                                return new AdminPathDto
                                                                                        .AdminQuizQuestionDto(
                                                                                        q.getId(),
                                                                                        q.getKind(),
                                                                                        q
                                                                                                .getPrompt(),
                                                                                        optsList,
                                                                                        q
                                                                                                .getCorrectAnswer(),
                                                                                        q
                                                                                                .getExplanation(),
                                                                                        q
                                                                                                .getPoints());
                                                                            })
                                                                    .toList()
                                                            : List.of();

                                            List<String> prereqs = List.of();
                                            if (st.getPrerequisites() != null) {
                                                try {
                                                    prereqs =
                                                            objectMapper.readValue(
                                                                    st.getPrerequisites(),
                                                                    new com.fasterxml.jackson.core
                                                                                    .type
                                                                                    .TypeReference<
                                                                            List<String>>() {});
                                                } catch (Exception e) {
                                                    log.warn(
                                                            "Could not parse stored prerequisites"
                                                                    + " for subtopic {}",
                                                            st.getId(),
                                                            e);
                                                }
                                            }

                                            List<AdminPathDto.AdminCodeSnippetDto> snippets =
                                                    st.getCodeSnippets() != null
                                                            ? st.getCodeSnippets().stream()
                                                                    .sorted(
                                                                            Comparator.comparingInt(
                                                                                    SubtopicCodeSnippet
                                                                                            ::getOrderIndex))
                                                                    .map(
                                                                            sn ->
                                                                                    new AdminPathDto
                                                                                            .AdminCodeSnippetDto(
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

                                            return new AdminPathDto.AdminSubtopicDto(
                                                    st.getId(),
                                                    st.getTitle(),
                                                    st.getContent(),
                                                    st.getOrderIndex(),
                                                    st.getStatus() != null
                                                            ? st.getStatus().name()
                                                            : "DRAFT",
                                                    st.getLevel() != null
                                                            ? st.getLevel()
                                                            : "beginner",
                                                    st.getTrack() != null
                                                            ? st.getTrack()
                                                            : "concept",
                                                    prereqs,
                                                    st.getVideoUrl(),
                                                    st.getEstimatedMinutes() > 0
                                                            ? st.getEstimatedMinutes()
                                                            : 5,
                                                    snippets,
                                                    questions);
                                        })
                                .toList()
                        : List.of();

        return new AdminPathDto.AdminTopicDto(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getCategory(),
                t.getDuration(),
                t.getOrderIndex() != null ? t.getOrderIndex() : 0,
                t.getStatus() != null ? t.getStatus().name() : "DRAFT",
                subtopics);
    }

    private AdminPathDto toAdminPathSummaryDto(Path path) {
        List<AdminPathDto.AdminTopicDto> topics =
                path.getTopics().stream()
                        .sorted(
                                Comparator.<Topic>comparingInt(
                                        t -> t.getOrderIndex() != null ? t.getOrderIndex() : 0))
                        .map(
                                t ->
                                        new AdminPathDto.AdminTopicDto(
                                                t.getId(),
                                                t.getTitle(),
                                                t.getDescription(),
                                                t.getCategory(),
                                                t.getDuration(),
                                                t.getOrderIndex() != null ? t.getOrderIndex() : 1,
                                                t.getStatus() != null
                                                        ? t.getStatus().name()
                                                        : "DRAFT",
                                                List.of()))
                        .toList();

        return new AdminPathDto(
                path.getId(),
                path.getTitle(),
                path.getDescription(),
                path.getCategory(),
                path.getManagedBy(),
                path.getStatus() != null ? path.getStatus().name() : "DRAFT",
                topics);
    }
}
