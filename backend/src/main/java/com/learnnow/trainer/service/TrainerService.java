package com.learnnow.trainer.service;

import com.learnnow.admin.entity.ContentBlock;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.trainer.dto.ChatRequest;
import com.learnnow.trainer.dto.GoalRequest;
import com.learnnow.trainer.dto.GoalResponse;
import com.learnnow.trainer.dto.NoteResponse;
import com.learnnow.trainer.dto.TrainerProfileResponse;
import com.learnnow.trainer.entity.LearnerGoal;
import com.learnnow.trainer.entity.TrainerNote;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.repository.LearnerGoalRepository;
import com.learnnow.trainer.repository.TrainerNoteRepository;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The personal trainer: the learner's goal, the trainer's notes, and Ask AI conversations.
 *
 * <p>A conversation turn sends learnnow-ai three things it cannot know: the platform guide (how
 * learnNow works), the learner summary (see {@link LearnerSummaryService}) and the page they are
 * on. Every few turns the conversation is also distilled into at most three notes, so what was
 * learned about the learner outlives the conversation, which is never stored.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TrainerService {

    /** Notes are drawn from every third learner message: often enough, without a call per turn. */
    static final int NOTES_EVERY_N_MESSAGES = 3;

    static final int MAX_NOTES = 60;
    private static final String NOTE_SOURCE = "ask_ai";
    private static final int PAGE_CHARS = 12_000;

    private final AiClient aiClient;
    private final LearnerSummaryService summaryService;
    private final LearnerGoalRepository goalRepository;
    private final TrainerNoteRepository noteRepository;
    private final SubtopicRepository subtopicRepository;
    private final TopicRepository topicRepository;
    private final TopicInterviewRepository interviewRepository;
    private final UserLearningPreferencesRepository preferencesRepository;

    private volatile String platformGuide;

    @Transactional(readOnly = true)
    public TrainerProfileResponse profile(String userId) {
        boolean available = aiClient.configured();
        boolean voiceAvailable = aiClient.voiceAvailable();
        int left = interviewsLeftThisMonth(userId);
        return new TrainerProfileResponse(
                available,
                voiceAvailable,
                summaryService.personalised(userId),
                left,
                goalRepository.findById(userId).map(GoalResponse::from).orElse(null),
                notes(userId));
    }

    public int interviewsLeftThisMonth(String userId) {
        ZoneId zone =
                preferencesRepository
                        .findByUserId(userId)
                        .map(
                                p -> {
                                    try {
                                        return ZoneId.of(p.getTimezone());
                                    } catch (Exception e) {
                                        return ZoneId.of("UTC");
                                    }
                                })
                        .orElse(ZoneId.of("UTC"));
        Instant monthStart =
                ZonedDateTime.now(zone).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        long used =
                interviewRepository.countByUserIdAndCreatedAtAfterAndStatusNot(
                        userId, monthStart, InterviewStatus.FAILED);
        return (int) Math.max(0, 5 - used);
    }

    @Transactional
    public GoalResponse saveGoal(String userId, GoalRequest request) {
        LearnerGoal goal =
                goalRepository
                        .findById(userId)
                        .orElseGet(() -> LearnerGoal.builder().userId(userId).build());
        goal.setTargetRole(blankToNull(request.targetRole()));
        goal.setTargetDate(request.targetDate());
        goal.setHoursPerWeek(request.hoursPerWeek());
        goal.setUpdatedAt(Instant.now());
        return GoalResponse.from(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> notes(String userId) {
        return noteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NoteResponse::from)
                .toList();
    }

    @Transactional
    public void deleteNote(String userId, UUID noteId) {
        if (noteRepository.deleteByIdAndUserId(noteId, userId) == 0) {
            throw new NotFoundException("trainer_note_not_found");
        }
    }

    @Transactional
    public void deleteAllNotes(String userId) {
        noteRepository.deleteAll(noteRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    /**
     * Builds what learnnow-ai needs for one reply. Runs inside a read transaction because the page
     * text comes from lazily loaded lesson blocks.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> chatContext(String userId, ChatRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("platform", "learnNow");
        body.put("platform_guide", platformGuide());
        body.put("learner", summaryService.summarise(userId));
        body.put("page", page(request.page()));
        body.put("quiz_in_progress", request.quizInProgress());
        body.put(
                "messages",
                request.messages().stream()
                        .map(t -> Map.of("role", t.role(), "content", t.content()))
                        .toList());
        return body;
    }

    /**
     * Streams one reply to {@code onText}; afterwards, maybe distils notes. {@code context} comes
     * from {@link #chatContext}, called separately through the proxy so its read transaction
     * applies - and so no transaction is held open for the seconds the reply takes to stream.
     */
    public void streamReply(
            String userId,
            ChatRequest request,
            Map<String, Object> context,
            Consumer<String> onText) {
        aiClient.chat(context, onText);
        long learnerMessages =
                request.messages().stream().filter(t -> t.role().equals("user")).count();
        if (learnerMessages % NOTES_EVERY_N_MESSAGES == 0 && summaryService.personalised(userId)) {
            try {
                distilNotes(userId, request);
            } catch (RuntimeException e) {
                // Notes are a by-product; failing to write them must not fail the reply already
                // sent.
                log.warn("Trainer notes not written: {}", e.getMessage());
            }
        }
    }

    public String transcribe(byte[] wav) {
        return aiClient.transcribe(wav, "assistant_voice");
    }

    void distilNotes(String userId, ChatRequest request) {
        List<TrainerNote> existing = noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("existing_notes", existing.stream().map(TrainerNote::getText).toList());
        body.put(
                "messages",
                request.messages().stream()
                        .map(t -> Map.of("role", t.role(), "content", t.content()))
                        .toList());
        saveDistilledNotes(userId, body, NOTE_SOURCE);
    }

    @Transactional
    public List<TrainerNote> saveDistilledNotes(
            String userId, Map<String, Object> body, String source) {
        List<TrainerNote> existing = noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Set<String> known = new HashSet<>();
        existing.forEach(n -> known.add(n.getText().strip().toLowerCase(Locale.ROOT)));
        List<TrainerNote> fresh =
                aiClient.notes(body).stream()
                        .filter(
                                n ->
                                        known.add(
                                                n.getOrDefault("text", "")
                                                        .strip()
                                                        .toLowerCase(Locale.ROOT)))
                        .map(
                                n ->
                                        TrainerNote.builder()
                                                .id(UUID.randomUUID())
                                                .userId(userId)
                                                .kind(n.get("kind"))
                                                .text(n.get("text").strip())
                                                .source(source)
                                                .build())
                        .toList();
        if (!fresh.isEmpty()) {
            noteRepository.saveAll(fresh);
            // Keep the newest MAX_NOTES; older ones have been superseded or forgotten.
            List<TrainerNote> all = noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (all.size() > MAX_NOTES) {
                noteRepository.deleteAll(all.subList(MAX_NOTES, all.size()));
            }
        }
        return fresh;
    }

    private Map<String, Object> page(ChatRequest.PageRef ref) {
        if (ref == null || ref.id() == null) {
            return ref == null
                    ? null
                    : Map.of("kind", ref.kind(), "title", ref.kind(), "content", "");
        }
        return switch (ref.kind()) {
            case "subtopic" ->
                    subtopicRepository
                            .findByIdWithTopic(ref.id())
                            .filter(s -> s.getStatus() == ContentStatus.PUBLISHED)
                            .map(TrainerService::lessonPage)
                            .orElse(null);
            case "topic" ->
                    topicRepository.findById(ref.id()).map(TrainerService::topicPage).orElse(null);
            default -> null;
        };
    }

    static Map<String, Object> lessonPage(Subtopic lesson) {
        StringBuilder text = new StringBuilder();
        if (lesson.getContent() != null) text.append(lesson.getContent()).append("\n\n");
        for (ContentBlock block : lesson.getBlocks()) {
            // Quiz blocks hold questions and answers; the trainer must not read those out.
            if (block.getBody() != null && !"quiz".equalsIgnoreCase(block.getType())) {
                text.append(block.getBody()).append("\n\n");
            }
        }
        String content =
                text.length() > PAGE_CHARS ? text.substring(0, PAGE_CHARS) : text.toString();
        Topic topic = lesson.getTopic();
        return Map.of(
                "kind",
                "lesson",
                "title",
                (topic != null ? topic.getTitle() + " > " : "") + lesson.getTitle(),
                "content",
                content.strip());
    }

    private static Map<String, Object> topicPage(Topic topic) {
        return Map.of(
                "kind", "topic",
                "title", topic.getTitle(),
                "content", Objects.requireNonNullElse(topic.getDescription(), ""));
    }

    private String platformGuide() {
        if (platformGuide == null) {
            try {
                platformGuide =
                        new ClassPathResource("trainer/platform-guide.md")
                                .getContentAsString(StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
        return platformGuide;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }
}
