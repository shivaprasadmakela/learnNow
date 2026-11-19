package com.learnnow.trainer.interview.service;

import com.learnnow.common.exception.AiUnavailableException;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.service.ActivityRecordingService;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.paths.repository.TopicRepository.TopicHeader;
import com.learnnow.privacy.entity.ConsentPurpose;
import com.learnnow.privacy.service.ConsentService;
import com.learnnow.trainer.feature.AiFeature;
import com.learnnow.trainer.feature.AiFeatureService;
import com.learnnow.trainer.interview.dto.InterviewAvailabilityResponse;
import com.learnnow.trainer.interview.dto.MockAvailabilityResponse;
import com.learnnow.trainer.interview.dto.StartInterviewResponse;
import com.learnnow.trainer.interview.dto.TopicInterviewReportResponse;
import com.learnnow.trainer.interview.dto.TopicInterviewSummaryResponse;
import com.learnnow.trainer.interview.dto.TranscriptCallbackRequest;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.entity.TopicInterviewAnswer;
import com.learnnow.trainer.interview.entity.TopicInterviewTurn;
import com.learnnow.trainer.interview.repository.TopicInterviewAnswerRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewTurnRepository;
import com.learnnow.trainer.repository.LearnerGoalRepository;
import com.learnnow.trainer.resume.entity.LearnerResume;
import com.learnnow.trainer.resume.repository.LearnerResumeRepository;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.TrainerQuotaService;
import com.learnnow.trainer.service.TrainerService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Voice interviews: topic interviews on a completed topic, mock interviews built around the
 * learner's resume, and retries of a single question.
 *
 * <p>No database transaction is held open across a call to learnnow-ai. Writing a mock plan takes
 * up to 20 seconds, starting the voice room up to 30 and scoring up to 90; a transaction (and, for
 * scoring, a row lock) held that long ties up a pooled connection, and when the call failed the
 * FAILED status written inside the same transaction was rolled back with everything else. Each step
 * that touches the database runs in its own short transaction instead.
 */
@Service
@Slf4j
public class TopicInterviewService {

    /** Ended reasons the voice worker sends when it could not run the interview at all. */
    private static final Set<String> WORKER_FAILURES = Set.of("budget_exceeded", "worker_error");

    /** A COMPLETED interview not scored after this long is scored again by the sweeper... */
    private static final long RESCORE_AFTER_MINUTES = 5;

    /** ...and marked FAILED (refunding the quota) once it is this old. */
    private static final long GIVE_UP_AFTER_MINUTES = 30;

    /** Topic and mock interviews award their bonus at this overall score. */
    static final int STRONG_SCORE = 70;

    private final TopicInterviewRepository interviewRepository;
    private final TopicInterviewTurnRepository turnRepository;
    private final TopicInterviewAnswerRepository answerRepository;
    private final TopicRepository topicRepository;
    private final InterviewQuestionRepository questionRepository;
    private final LearnerResumeRepository resumeRepository;
    private final LearnerGoalRepository goalRepository;
    private final ActivityRecordingService activityRecordingService;
    private final TopicInterviewPlanner planner;
    private final AiClient aiClient;
    private final TrainerService trainerService;
    private final TrainerQuotaService quotaService;
    private final AiFeatureService featureService;
    private final ConsentService consentService;
    private final Executor executor;
    private final TransactionTemplate transactionTemplate;
    private final TransactionTemplate readOnly;

    public TopicInterviewService(
            TopicInterviewRepository interviewRepository,
            TopicInterviewTurnRepository turnRepository,
            TopicInterviewAnswerRepository answerRepository,
            TopicRepository topicRepository,
            InterviewQuestionRepository questionRepository,
            LearnerResumeRepository resumeRepository,
            LearnerGoalRepository goalRepository,
            ActivityRecordingService activityRecordingService,
            TopicInterviewPlanner planner,
            AiClient aiClient,
            TrainerService trainerService,
            TrainerQuotaService quotaService,
            AiFeatureService featureService,
            ConsentService consentService,
            @Qualifier("taskExecutor") Executor executor,
            PlatformTransactionManager transactionManager) {
        this.interviewRepository = interviewRepository;
        this.turnRepository = turnRepository;
        this.answerRepository = answerRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.resumeRepository = resumeRepository;
        this.goalRepository = goalRepository;
        this.activityRecordingService = activityRecordingService;
        this.planner = planner;
        this.aiClient = aiClient;
        this.trainerService = trainerService;
        this.quotaService = quotaService;
        this.featureService = featureService;
        this.consentService = consentService;
        this.executor = executor;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.readOnly = new TransactionTemplate(transactionManager);
        this.readOnly.setReadOnly(true);
    }

    /** Topic interviews left this month; mock interviews and retries have their own quotas. */
    public int interviewsLeftThisMonth(String userId) {
        return quotaService.topicInterviewsLeft(userId);
    }

    @Transactional(readOnly = true)
    public InterviewAvailabilityResponse availability(String userId, UUID topicId) {
        if (!aiClient.configured()) {
            return new InterviewAvailabilityResponse(false, "ai_unavailable", 0);
        }
        if (!featureService.enabled(AiFeature.TOPIC_INTERVIEW)) {
            return new InterviewAvailabilityResponse(false, "ai_feature_off", 0);
        }
        if (!aiClient.voiceAvailable()) {
            return new InterviewAvailabilityResponse(false, "topic_interview_voice_unavailable", 0);
        }

        int left = interviewsLeftThisMonth(userId);
        if (left <= 0) {
            return new InterviewAvailabilityResponse(false, "topic_interview_quota_reached", 0);
        }

        List<InterviewQuestionRepository.SubtopicRow> subtopics =
                questionRepository.findPublishedSubtopicsInTopic(topicId);
        if (subtopics.isEmpty()) {
            return new InterviewAvailabilityResponse(false, "topic_interview_no_questions", left);
        }

        List<UUID> subtopicIds =
                subtopics.stream().map(InterviewQuestionRepository.SubtopicRow::getId).toList();
        List<InterviewQuestion> allQuestions =
                questionRepository.findBySubtopicIdInAndStatus(
                        subtopicIds, ContentStatus.PUBLISHED);
        boolean hasRootQuestions = allQuestions.stream().anyMatch(q -> q.getParentId() == null);

        if (!hasRootQuestions) {
            return new InterviewAvailabilityResponse(false, "topic_interview_no_questions", left);
        }

        return new InterviewAvailabilityResponse(true, null, left);
    }

    public StartInterviewResponse start(String userId, UUID topicId) {
        featureService.requireEnabled(AiFeature.TOPIC_INTERVIEW);
        int left = interviewsLeftThisMonth(userId);
        if (left <= 0) {
            throw new ValidationException("topic_interview_quota_reached");
        }
        requireVoice();

        UUID interviewId = UUID.randomUUID();
        Map<String, Object> plan =
                readOnly.execute(status -> planner.plan(topicId, userId, interviewId));

        TopicInterview interview =
                TopicInterview.builder()
                        .id(interviewId)
                        .userId(userId)
                        .topicId(topicId)
                        .kind(InterviewKind.TOPIC)
                        .title(truncate((String) plan.get("topic_title"), 200))
                        .status(InterviewStatus.CREATED)
                        .plan(plan)
                        .pointsAwarded(0)
                        .build();
        return launch(interview);
    }

    // --- Mock interviews ---------------------------------------------------

    public MockAvailabilityResponse mockAvailability(String userId) {
        boolean hasResume = resumeRepository.findPresent(userId).isPresent();
        List<MockAvailabilityResponse.KindOption> kinds =
                InterviewKind.mockKinds().stream()
                        .map(
                                k ->
                                        new MockAvailabilityResponse.KindOption(
                                                k.name(), k.label(), k.minutes(), k.needsResume()))
                        .toList();
        int left = quotaService.mockInterviewsLeft(userId);
        String reason = null;
        if (!aiClient.configured()) {
            reason = "ai_unavailable";
        } else if (!featureService.enabled(AiFeature.MOCK_INTERVIEW)) {
            reason = "ai_feature_off";
        } else if (!aiClient.voiceAvailable()) {
            reason = "topic_interview_voice_unavailable";
        } else if (left <= 0) {
            reason = "mock_interview_quota_reached";
        }
        return new MockAvailabilityResponse(reason == null, reason, left, hasResume, kinds);
    }

    /**
     * Starts a mock interview. learnnow-ai writes the plan (10-20 seconds) from the learner's
     * resume, the role and the bank topics on offer; this fills its bank slots with real bank
     * questions and starts the voice room.
     */
    public StartInterviewResponse startMock(
            String userId, String kindName, String role, boolean useJobDescription) {
        featureService.requireEnabled(AiFeature.MOCK_INTERVIEW);
        InterviewKind kind = mockKind(kindName);
        if (quotaService.mockInterviewsLeft(userId) <= 0) {
            throw new ValidationException("mock_interview_quota_reached");
        }
        Optional<LearnerResume> resume = resumeRepository.findPresent(userId);
        if (kind.needsResume() && resume.isEmpty()) {
            throw new ValidationException("mock_interview_needs_resume");
        }
        requireVoice();

        String typedRole = truncate(blankToNull(role), 120);
        String resumeRole = resume.map(LearnerResume::getTargetRole).orElse(null);
        String goalRole =
                goalRepository
                        .findById(userId)
                        .map(g -> blankToNull(g.getTargetRole()))
                        .orElse(null);
        Map<String, Object> profile = resume.map(LearnerResume::getProfile).orElse(null);

        List<TopicInterviewPlanner.BankTopic> bankTopics =
                readOnly.execute(status -> planner.bankTopics(userId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("kind", kind.wire());
        String askedRole = firstNonNull(typedRole, resumeRole, goalRole);
        if (askedRole != null) body.put("role", askedRole);
        if (profile != null) body.put("profile", profile);
        if (useJobDescription) {
            resume.map(LearnerResume::getJobDescription)
                    .ifPresent(jd -> body.put("job_description", jd));
        }
        body.put(
                "bank_topics",
                bankTopics.stream()
                        .map(t -> Map.of("id", t.id().toString(), "title", t.title()))
                        .toList());

        Map<String, Object> written = aiClient.buildInterviewPlan(body);

        String title =
                truncate(
                        firstNonNull(
                                typedRole,
                                resumeRole,
                                blankToNull(asString(written.get("title"))),
                                kind.label()),
                        200);
        Set<UUID> offered =
                bankTopics.stream()
                        .map(TopicInterviewPlanner.BankTopic::id)
                        .collect(Collectors.toSet());
        UUID interviewId = UUID.randomUUID();
        Map<String, Object> plan =
                readOnly.execute(
                        status ->
                                planner.mockPlan(
                                        userId,
                                        interviewId,
                                        kind,
                                        title,
                                        TopicInterviewPlanner.candidateBrief(profile),
                                        written.get("items"),
                                        offered));

        TopicInterview interview =
                TopicInterview.builder()
                        .id(interviewId)
                        .userId(userId)
                        .kind(kind)
                        .title(title)
                        .status(InterviewStatus.CREATED)
                        .plan(plan)
                        .pointsAwarded(0)
                        .build();
        return launch(interview);
    }

    /**
     * Asks one question from a scored interview again: a short session with no follow-ups. It
     * awards no points and does not count towards the monthly quotas, only the daily retry limit.
     */
    public StartInterviewResponse retry(String userId, UUID interviewId, UUID planQuestionId) {
        if (planQuestionId == null) {
            throw new NotFoundException("interview_question_not_found");
        }
        TopicInterview parent =
                readOnly.execute(
                        status ->
                                interviewRepository
                                        .findByIdAndUserId(interviewId, userId)
                                        .orElseThrow(
                                                () ->
                                                        new NotFoundException(
                                                                "topic_interview_not_found")));
        featureService.requireEnabled(
                parent.getKind().isMock() ? AiFeature.MOCK_INTERVIEW : AiFeature.TOPIC_INTERVIEW);
        if (parent.getStatus() != InterviewStatus.SCORED) {
            throw new ValidationException("interview_retry_not_scored");
        }
        Map<String, Object> question =
                planQuestions(parent.getPlan()).stream()
                        .filter(q -> planQuestionId.toString().equals(q.get("id")))
                        .findFirst()
                        .map(LinkedHashMap::new)
                        .orElseThrow(() -> new NotFoundException("interview_question_not_found"));
        if (quotaService.retriesLeftToday(userId) <= 0) {
            throw new ValidationException("interview_retry_limit");
        }
        requireVoice();

        question.put("follow_ups", List.of());
        UUID retryId = UUID.randomUUID();
        String title = parent.getTitle() != null ? parent.getTitle() : topicTitle(parent);
        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("interview_id", retryId.toString());
        plan.put("tenant", "learnnow");
        plan.put("kind", InterviewKind.RETRY.wire());
        plan.put(
                "topic_title",
                firstNonNull(asString(parent.getPlan().get("topic_title")), title, "Practice"));
        planner.putFirstName(plan, userId);
        if (parent.getPlan().get("candidate_brief") instanceof String brief) {
            plan.put("candidate_brief", brief);
        }
        plan.put("questions", List.of(question));
        plan.put("max_seconds", InterviewKind.RETRY.maxSeconds());
        plan.put("callback_url", planner.callbackUrl(retryId));

        TopicInterview interview =
                TopicInterview.builder()
                        .id(retryId)
                        .userId(userId)
                        .topicId(parent.getTopicId())
                        .kind(InterviewKind.RETRY)
                        .title(truncate(title, 200))
                        .parentInterviewId(parent.getId())
                        .status(InterviewStatus.CREATED)
                        .plan(plan)
                        .pointsAwarded(0)
                        .build();
        return launch(interview);
    }

    /**
     * Saves the CREATED row, asks learnnow-ai for the voice room outside any transaction, then
     * records the room - or marks the row FAILED, which refunds the quota. Committing the row first
     * means the worker's transcript callback finds it even if the start call timed out after the
     * agent was dispatched.
     */
    private StartInterviewResponse launch(TopicInterview interview) {
        transactionTemplate.executeWithoutResult(status -> interviewRepository.save(interview));

        Map<String, Object> aiResponse;
        try {
            aiResponse = aiClient.startInterview(interview.getPlan());
        } catch (RuntimeException e) {
            log.error("Failed to start AI interview session for {}", interview.getId(), e);
            transactionTemplate.executeWithoutResult(
                    status ->
                            interviewRepository
                                    .findById(interview.getId())
                                    .filter(row -> row.getStatus() == InterviewStatus.CREATED)
                                    .ifPresent(
                                            row -> {
                                                row.setStatus(InterviewStatus.FAILED);
                                                row.setEndedReason("ai_start_failed");
                                                interviewRepository.save(row);
                                            }));
            throw e;
        }

        String room = asString(aiResponse.get("room"));
        transactionTemplate.executeWithoutResult(
                status ->
                        interviewRepository
                                .findById(interview.getId())
                                .ifPresent(
                                        row -> {
                                            row.setRoom(room);
                                            interviewRepository.save(row);
                                        }));

        return new StartInterviewResponse(
                interview.getId(),
                asString(aiResponse.get("url")),
                asString(aiResponse.get("token")),
                maxSeconds(interview.getPlan(), interview.getKind()),
                interview.getKind().name());
    }

    // --- Transcript and scoring --------------------------------------------

    @Transactional
    public void recordTranscript(UUID interviewId, TranscriptCallbackRequest payload) {
        TopicInterview interview =
                interviewRepository
                        .findByIdForUpdate(interviewId)
                        .orElseThrow(() -> new NotFoundException("topic_interview_not_found"));

        if (interview.getStatus() != InterviewStatus.CREATED) {
            log.info(
                    "Ignoring duplicate or non-created transcript callback for interview {}",
                    interviewId);
            return;
        }

        // Nothing to score: the worker could not run the interview, or the learner never
        // answered. FAILED refunds the monthly quota and skips a paid scoring call.
        boolean learnerSpoke =
                payload.turns() != null
                        && payload.turns().stream().anyMatch(t -> "user".equals(t.role()));
        if (WORKER_FAILURES.contains(payload.ended_reason()) || !learnerSpoke) {
            interview.setStatus(InterviewStatus.FAILED);
            interview.setCompletedAt(Instant.now());
            interview.setCostInr(payload.cost_inr());
            interview.setEndedReason(
                    WORKER_FAILURES.contains(payload.ended_reason())
                            ? payload.ended_reason()
                            : "no_answers");
            interviewRepository.save(interview);
            return;
        }

        List<TopicInterviewTurn> turns = new ArrayList<>();
        if (payload.turns() != null) {
            int seq = 1;
            for (TranscriptCallbackRequest.TurnPayload t : payload.turns()) {
                turns.add(
                        TopicInterviewTurn.builder()
                                .interviewId(interviewId)
                                .seq(seq++)
                                .role(t.role())
                                .text(t.text())
                                .atSeconds(t.at() != null ? t.at() : BigDecimal.ZERO)
                                .questionId(t.question_id())
                                .build());
            }
            turnRepository.saveAll(turns);
        }

        interview.setStatus(InterviewStatus.COMPLETED);
        interview.setCompletedAt(Instant.now());
        interview.setCostInr(payload.cost_inr());
        interview.setEndedReason(payload.ended_reason());
        interviewRepository.save(interview);

        // Trigger scoring asynchronously after transaction commit
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            executor.execute(() -> scoreAsync(interviewId));
                        }
                    });
        } else {
            executor.execute(() -> scoreAsync(interviewId));
        }
    }

    public void scoreAsync(UUID interviewId) {
        try {
            score(interviewId);
        } catch (Exception e) {
            log.error("Asynchronous scoring failed for interview {}", interviewId, e);
        }
    }

    /** What scoring needs from the database, read before the AI call. */
    private record ScoringInput(
            String userId,
            InterviewKind kind,
            Map<String, Object> payload,
            List<TopicInterviewTurn> turns) {}

    /**
     * Scores a COMPLETED interview: reads it, asks learnnow-ai (up to 90 seconds, no transaction
     * open), then saves the result under a row lock, re-checking the status so a second scorer that
     * raced this one changes nothing.
     */
    public void score(UUID interviewId) {
        ScoringInput input =
                readOnly.execute(
                        status -> {
                            TopicInterview interview =
                                    interviewRepository.findById(interviewId).orElse(null);
                            if (interview == null
                                    || interview.getStatus() != InterviewStatus.COMPLETED) {
                                return null;
                            }
                            List<TopicInterviewTurn> turns =
                                    turnRepository.findByInterviewIdOrderBySeqAsc(interviewId);
                            return new ScoringInput(
                                    interview.getUserId(),
                                    interview.getKind(),
                                    scorePayload(interview.getPlan(), turns),
                                    turns);
                        });
        if (input == null) {
            return;
        }

        Map<String, Object> scoreResult;
        try {
            scoreResult = aiClient.scoreInterview(input.payload());
        } catch (Exception e) {
            log.error("AI client scoring failed for interview {}", interviewId, e);
            transactionTemplate.executeWithoutResult(
                    status ->
                            interviewRepository
                                    .findByIdForUpdate(interviewId)
                                    .filter(row -> row.getStatus() == InterviewStatus.COMPLETED)
                                    .ifPresent(
                                            row -> {
                                                row.setStatus(InterviewStatus.FAILED);
                                                row.setEndedReason("scoring_failed");
                                                interviewRepository.save(row);
                                            }));
            return;
        }

        Boolean saved = transactionTemplate.execute(status -> applyScore(interviewId, scoreResult));
        if (!Boolean.TRUE.equals(saved)) {
            return;
        }

        // Notes are personal data the trainer keeps, so only with the learner's consent; and a
        // by-product, so failing to write them must not undo the score.
        if (!consentService.hasConsent(input.userId(), ConsentPurpose.PERSONALISATION)) {
            return;
        }
        try {
            List<Map<String, String>> noteMessages =
                    input.turns().stream()
                            .map(t -> Map.of("role", t.getRole(), "content", t.getText()))
                            .toList();
            trainerService.saveDistilledNotes(
                    input.userId(),
                    Map.of("messages", noteMessages),
                    input.kind().isMock() ? "mock_interview" : "topic_interview");
        } catch (Exception e) {
            log.warn(
                    "Failed to extract trainer notes from interview {}: {}",
                    interviewId,
                    e.getMessage());
        }
    }

    private static Map<String, Object> scorePayload(
            Map<String, Object> plan, List<TopicInterviewTurn> turns) {
        List<Map<String, Object>> turnDtos =
                turns.stream()
                        .map(
                                t -> {
                                    Map<String, Object> map = new LinkedHashMap<>();
                                    map.put("role", t.getRole());
                                    map.put("text", t.getText());
                                    map.put("at", t.getAtSeconds());
                                    map.put(
                                            "question_id",
                                            t.getQuestionId() != null
                                                    ? t.getQuestionId().toString()
                                                    : null);
                                    return map;
                                })
                        .toList();
        return Map.of("tenant", "learnnow", "plan", plan, "turns", turnDtos);
    }

    /**
     * Saves one scoring result. Prompt, category and model answer come from the stored plan,
     * because a question the AI wrote exists nowhere else; {@code question_id} and {@code
     * subtopic_id} are set only when the question is a real bank row.
     */
    private boolean applyScore(UUID interviewId, Map<String, Object> scoreResult) {
        TopicInterview interview = interviewRepository.findByIdForUpdate(interviewId).orElse(null);
        if (interview == null || interview.getStatus() != InterviewStatus.COMPLETED) {
            return false;
        }

        Integer overall = asInteger(scoreResult.get("overall"));
        interview.setOverallScore(overall);
        interview.setHabits(asMap(scoreResult.get("habits")));
        interview.setFeedback(feedback(scoreResult));

        Map<String, Map<String, Object>> planById = new HashMap<>();
        planQuestions(interview.getPlan())
                .forEach(q -> planById.put(String.valueOf(q.get("id")), q));

        if (scoreResult.get("questions") instanceof List<?> qList) {
            List<TopicInterviewAnswer> answers = new ArrayList<>();
            for (Object obj : qList) {
                if (!(obj instanceof Map<?, ?> qMap)) continue;
                String qIdStr = asString(qMap.get("id"));
                Map<String, Object> planQ = planById.getOrDefault(qIdStr, Map.of());
                UUID planQuestionId = TopicInterviewPlanner.parseUuid(qIdStr).orElse(null);
                InterviewQuestion bank =
                        planQuestionId != null
                                ? questionRepository.findById(planQuestionId).orElse(null)
                                : null;

                String prompt =
                        firstNonNull(
                                blankToNull(asString(planQ.get("prompt"))),
                                bank != null ? bank.getPrompt() : null,
                                "");
                String modelAnswer =
                        firstNonNull(
                                blankToNull(asString(planQ.get("model_answer"))),
                                bank != null
                                        ? blankToNull(
                                                TopicInterviewPlanner.extractModelAnswer(bank))
                                        : null);
                answers.add(
                        TopicInterviewAnswer.builder()
                                .interviewId(interviewId)
                                .planQuestionId(planQuestionId)
                                .questionId(bank != null ? bank.getId() : null)
                                .subtopicId(bank != null ? bank.getSubtopicId() : null)
                                .category(
                                        firstNonNull(
                                                blankToNull(asString(planQ.get("category"))),
                                                "technical"))
                                .prompt(prompt)
                                .modelAnswer(modelAnswer)
                                .score(asInteger(qMap.get("score")))
                                .good(asString(qMap.get("good")))
                                .missing(asString(qMap.get("missing")))
                                .evidence(asString(qMap.get("evidence")))
                                .build());
            }
            if (!answers.isEmpty()) {
                answerRepository.saveAll(answers);
            }
        }

        int pointsToAward = points(interview, overall);
        if (pointsToAward > 0) {
            activityRecordingService.recordDailyPoints(
                    interview.getUserId(), quotaService.zone(interview.getUserId()), pointsToAward);
        }
        interview.setPointsAwarded(pointsToAward);
        interview.setStatus(InterviewStatus.SCORED);
        interviewRepository.save(interview);
        return true;
    }

    /**
     * Topic interviews: once per topic, the first time one is scored. Mock interviews: every one.
     * Retries: none, or retrying the best question would farm points.
     */
    private int points(TopicInterview interview, Integer overall) {
        boolean strong = overall != null && overall >= STRONG_SCORE;
        return switch (interview.getKind()) {
            case TOPIC -> {
                boolean alreadyScored =
                        interview.getTopicId() != null
                                && interviewRepository.existsByUserIdAndTopicIdAndKindAndStatus(
                                        interview.getUserId(),
                                        interview.getTopicId(),
                                        InterviewKind.TOPIC,
                                        InterviewStatus.SCORED);
                yield alreadyScored
                        ? 0
                        : PointsConfig.TOPIC_INTERVIEW_COMPLETED
                                + (strong ? PointsConfig.TOPIC_INTERVIEW_STRONG_BONUS : 0);
            }
            case RETRY -> 0;
            default ->
                    PointsConfig.MOCK_INTERVIEW_COMPLETED
                            + (strong ? PointsConfig.MOCK_INTERVIEW_STRONG_BONUS : 0);
        };
    }

    /** The written debrief, or null when learnnow-ai sent none (an older reply). */
    static Map<String, Object> feedback(Map<String, Object> scoreResult) {
        if (!(scoreResult.get("dimensions") instanceof Map<?, ?>)
                && !(scoreResult.get("strengths") instanceof List<?>)
                && !(scoreResult.get("next_step") instanceof String)) {
            return null;
        }
        Map<String, Object> feedback = new LinkedHashMap<>();
        feedback.put("dimensions", scoreResult.get("dimensions"));
        feedback.put(
                "strengths", scoreResult.get("strengths") instanceof List<?> l ? l : List.of());
        feedback.put(
                "improvements",
                scoreResult.get("improvements") instanceof List<?> l ? l : List.of());
        feedback.put("next_step", asString(scoreResult.get("next_step")));
        return feedback;
    }

    // --- Reports, history, rating ------------------------------------------

    @Transactional(readOnly = true)
    public TopicInterviewReportResponse report(String userId, UUID interviewId) {
        TopicInterview interview =
                interviewRepository
                        .findByIdAndUserId(interviewId, userId)
                        .orElseThrow(() -> new NotFoundException("topic_interview_not_found"));

        String topicTitle = topicTitle(interview);

        List<TopicInterviewTurn> turns = turnRepository.findByInterviewIdOrderBySeqAsc(interviewId);
        List<TopicInterviewAnswer> answers = answerRepository.findByInterviewId(interviewId);

        // Answers in the order the plan asked them.
        List<Map<String, Object>> planQuestions = planQuestions(interview.getPlan());
        Map<String, Integer> order = new HashMap<>();
        Map<String, Map<String, Object>> planById = new HashMap<>();
        for (int i = 0; i < planQuestions.size(); i++) {
            String id = String.valueOf(planQuestions.get(i).get("id"));
            order.putIfAbsent(id, i);
            planById.putIfAbsent(id, planQuestions.get(i));
        }

        List<TopicInterviewReportResponse.AnswerFeedback> questionDtos =
                answers.stream()
                        .sorted(
                                Comparator.comparing(
                                                (TopicInterviewAnswer a) ->
                                                        order.getOrDefault(
                                                                String.valueOf(planKey(a)),
                                                                Integer.MAX_VALUE))
                                        .thenComparing(
                                                TopicInterviewAnswer::getCreatedAt,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(
                                a -> {
                                    Map<String, Object> planQ =
                                            planById.getOrDefault(
                                                    String.valueOf(planKey(a)), Map.of());
                                    return new TopicInterviewReportResponse.AnswerFeedback(
                                            planKey(a),
                                            a.getQuestionId(),
                                            a.getSubtopicId(),
                                            questionTopic(interview, a, planQ),
                                            firstNonNull(a.getCategory(), "technical"),
                                            a.getPrompt(),
                                            a.getScore(),
                                            a.getGood(),
                                            a.getMissing(),
                                            a.getEvidence(),
                                            modelAnswer(a));
                                })
                        .toList();

        List<TopicInterviewReportResponse.TurnDto> turnDtos =
                turns.stream()
                        .map(
                                t ->
                                        new TopicInterviewReportResponse.TurnDto(
                                                t.getSeq(),
                                                t.getRole(),
                                                t.getText(),
                                                t.getAtSeconds(),
                                                t.getQuestionId()))
                        .toList();

        return new TopicInterviewReportResponse(
                interview.getId(),
                interview.getKind().name(),
                interview.getTitle() != null ? interview.getTitle() : topicTitle,
                interview.getTopicId(),
                topicTitle,
                interview.getStatus().name(),
                interview.getOverallScore(),
                interview.getHabits(),
                interview.getFeedback(),
                interview.getPointsAwarded(),
                interview.getLearnerRating() != null
                        ? interview.getLearnerRating().intValue()
                        : null,
                interview.getParentInterviewId(),
                interview.getCreatedAt(),
                interview.getCompletedAt(),
                questionDtos,
                turnDtos);
    }

    @Transactional(readOnly = true)
    public List<TopicInterviewSummaryResponse> history(String userId) {
        return summaries(interviewRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    /** History rows for some interviews, with their topic titles fetched in one query. */
    @Transactional(readOnly = true)
    public List<TopicInterviewSummaryResponse> summaries(List<TopicInterview> interviews) {
        Map<UUID, String> titles =
                topicTitles(
                        interviews.stream()
                                .map(TopicInterview::getTopicId)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet()));
        return interviews.stream()
                .map(
                        i -> {
                            String topicTitle =
                                    i.getTopicId() != null ? titles.get(i.getTopicId()) : null;
                            return new TopicInterviewSummaryResponse(
                                    i.getId(),
                                    i.getKind().name(),
                                    i.getTitle() != null ? i.getTitle() : topicTitle,
                                    i.getTopicId(),
                                    topicTitle,
                                    i.getStatus().name(),
                                    i.getOverallScore(),
                                    i.getPointsAwarded(),
                                    i.getCreatedAt());
                        })
                .toList();
    }

    /** The learner's verdict on an evaluation; the admin page lists the unfair ones. */
    @Transactional
    public void rate(String userId, UUID interviewId, Integer rating, String comment) {
        if (rating == null || (rating != 1 && rating != -1)) {
            throw new ValidationException("interview_rating_invalid");
        }
        TopicInterview interview =
                interviewRepository
                        .findByIdAndUserId(interviewId, userId)
                        .orElseThrow(() -> new NotFoundException("topic_interview_not_found"));
        if (interview.getStatus() != InterviewStatus.SCORED) {
            throw new ValidationException("interview_rating_not_scored");
        }
        interview.setLearnerRating(rating.shortValue());
        interview.setLearnerComment(truncate(blankToNull(comment), 500));
        interviewRepository.save(interview);
    }

    // --- Sweepers ----------------------------------------------------------

    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void abandonStaleInterviews() {
        Instant staleThreshold = Instant.now().minus(15, ChronoUnit.MINUTES);
        List<TopicInterview> stale =
                interviewRepository.findByStatusAndCreatedAtBefore(
                        InterviewStatus.CREATED, staleThreshold);
        // A full-round mock interview runs 25 minutes; it is not stale until well after that.
        List<TopicInterview> expired =
                stale.stream()
                        .filter(
                                i ->
                                        i.getCreatedAt()
                                                .plusSeconds(
                                                        maxSeconds(i.getPlan(), i.getKind()) + 600L)
                                                .isBefore(Instant.now()))
                        .toList();
        for (TopicInterview i : expired) {
            i.setStatus(InterviewStatus.ABANDONED);
            i.setEndedReason("abandoned_timeout");
        }
        if (!expired.isEmpty()) {
            interviewRepository.saveAll(expired);
            log.info("Marked {} stale interviews as ABANDONED", expired.size());
        }
    }

    /**
     * Scoring runs on an in-memory executor, so a restart, or a scoring run that threw, leaves an
     * interview COMPLETED with no report. Score those again, and give up on old ones.
     */
    @Scheduled(fixedDelay = 300_000, initialDelay = 60_000)
    public void rescoreStuckInterviews() {
        Instant now = Instant.now();
        List<TopicInterview> stuck =
                interviewRepository.findByStatusAndCompletedAtBefore(
                        InterviewStatus.COMPLETED,
                        now.minus(RESCORE_AFTER_MINUTES, ChronoUnit.MINUTES));
        Instant giveUpBefore = now.minus(GIVE_UP_AFTER_MINUTES, ChronoUnit.MINUTES);
        for (TopicInterview i : stuck) {
            if (i.getCompletedAt().isBefore(giveUpBefore)) {
                transactionTemplate.executeWithoutResult(
                        status ->
                                interviewRepository
                                        .findByIdForUpdate(i.getId())
                                        .filter(row -> row.getStatus() == InterviewStatus.COMPLETED)
                                        .ifPresent(
                                                row -> {
                                                    row.setStatus(InterviewStatus.FAILED);
                                                    row.setEndedReason("scoring_timeout");
                                                    interviewRepository.save(row);
                                                }));
                log.warn("Gave up scoring interview {}", i.getId());
            } else {
                log.info("Scoring interview {} again", i.getId());
                scoreAsync(i.getId());
            }
        }
    }

    // --- helpers -----------------------------------------------------------

    private void requireVoice() {
        if (!aiClient.configured() || !aiClient.voiceAvailable()) {
            throw new AiUnavailableException("topic_interview_voice_unavailable");
        }
    }

    private static InterviewKind mockKind(String name) {
        try {
            InterviewKind kind =
                    InterviewKind.valueOf(
                            Objects.requireNonNullElse(name, "").strip().toUpperCase(Locale.ROOT));
            if (kind.isMock()) {
                return kind;
            }
        } catch (IllegalArgumentException ignored) {
            // Reported below.
        }
        throw new ValidationException("mock_interview_kind_invalid");
    }

    @SuppressWarnings("unchecked")
    static List<Map<String, Object>> planQuestions(Map<String, Object> plan) {
        if (plan == null || !(plan.get("questions") instanceof List<?> list)) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                out.add((Map<String, Object>) map);
            }
        }
        return out;
    }

    private static int maxSeconds(Map<String, Object> plan, InterviewKind kind) {
        Integer fromPlan = plan != null ? asInteger(plan.get("max_seconds")) : null;
        return fromPlan != null ? fromPlan : kind.maxSeconds();
    }

    /** Old answers predate plan_question_id; for those the bank id was the plan's id. */
    private static UUID planKey(TopicInterviewAnswer a) {
        return a.getPlanQuestionId() != null ? a.getPlanQuestionId() : a.getQuestionId();
    }

    private static UUID questionTopic(
            TopicInterview interview, TopicInterviewAnswer a, Map<String, Object> planQ) {
        Optional<UUID> fromPlan = TopicInterviewPlanner.parseUuid(planQ.get("topic_id"));
        if (fromPlan.isPresent()) {
            return a.getQuestionId() != null ? fromPlan.get() : null;
        }
        return a.getQuestionId() != null ? interview.getTopicId() : null;
    }

    /** Stored with the answer since this change; looked up in the bank for older reports. */
    private String modelAnswer(TopicInterviewAnswer a) {
        if (a.getModelAnswer() != null) {
            return a.getModelAnswer();
        }
        if (a.getQuestionId() == null) {
            return "";
        }
        return questionRepository
                .findById(a.getQuestionId())
                .map(TopicInterviewPlanner::extractModelAnswer)
                .orElse("");
    }

    private String topicTitle(TopicInterview interview) {
        if (interview.getTopicId() == null) {
            return null;
        }
        return topicRepository
                .findById(interview.getTopicId())
                .map(t -> t.getTitle())
                .orElse(interview.getKind() == InterviewKind.TOPIC ? "Unknown Topic" : null);
    }

    private Map<UUID, String> topicTitles(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> titles = new HashMap<>();
        for (TopicHeader h : topicRepository.findHeadersByIdIn(new HashSet<>(ids))) {
            titles.put(h.getId(), h.getTitle());
        }
        return titles;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
    }

    private static Integer asInteger(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }

    private static String asString(Object value) {
        return value instanceof String s ? s : null;
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T v : values) {
            if (v != null) return v;
        }
        return null;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
