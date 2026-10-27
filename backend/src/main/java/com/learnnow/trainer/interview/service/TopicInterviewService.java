package com.learnnow.trainer.interview.service;

import com.learnnow.common.exception.AiUnavailableException;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.service.ActivityRecordingService;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.trainer.interview.dto.InterviewAvailabilityResponse;
import com.learnnow.trainer.interview.dto.StartInterviewResponse;
import com.learnnow.trainer.interview.dto.TopicInterviewReportResponse;
import com.learnnow.trainer.interview.dto.TopicInterviewSummaryResponse;
import com.learnnow.trainer.interview.dto.TranscriptCallbackRequest;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.entity.TopicInterviewAnswer;
import com.learnnow.trainer.interview.entity.TopicInterviewTurn;
import com.learnnow.trainer.interview.repository.TopicInterviewAnswerRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewTurnRepository;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.TrainerService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@Slf4j
public class TopicInterviewService {

    private static final int MONTHLY_QUOTA = 5;

    /** Ended reasons the voice worker sends when it could not run the interview at all. */
    private static final Set<String> WORKER_FAILURES = Set.of("budget_exceeded", "worker_error");

    /** A COMPLETED interview not scored after this long is scored again by the sweeper... */
    private static final long RESCORE_AFTER_MINUTES = 5;

    /** ...and marked FAILED (refunding the quota) once it is this old. */
    private static final long GIVE_UP_AFTER_MINUTES = 30;

    private final TopicInterviewRepository interviewRepository;
    private final TopicInterviewTurnRepository turnRepository;
    private final TopicInterviewAnswerRepository answerRepository;
    private final TopicRepository topicRepository;
    private final InterviewQuestionRepository questionRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final ActivityRecordingService activityRecordingService;
    private final TopicInterviewPlanner planner;
    private final AiClient aiClient;
    private final TrainerService trainerService;
    private final Executor executor;
    private final TransactionTemplate transactionTemplate;

    public TopicInterviewService(
            TopicInterviewRepository interviewRepository,
            TopicInterviewTurnRepository turnRepository,
            TopicInterviewAnswerRepository answerRepository,
            TopicRepository topicRepository,
            InterviewQuestionRepository questionRepository,
            UserLearningPreferencesRepository preferencesRepository,
            ActivityRecordingService activityRecordingService,
            TopicInterviewPlanner planner,
            AiClient aiClient,
            TrainerService trainerService,
            @Qualifier("taskExecutor") Executor executor,
            PlatformTransactionManager transactionManager) {
        this.interviewRepository = interviewRepository;
        this.turnRepository = turnRepository;
        this.answerRepository = answerRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.preferencesRepository = preferencesRepository;
        this.activityRecordingService = activityRecordingService;
        this.planner = planner;
        this.aiClient = aiClient;
        this.trainerService = trainerService;
        this.executor = executor;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public int interviewsLeftThisMonth(String userId) {
        ZoneId zone = getUserZone(userId);
        Instant monthStart =
                ZonedDateTime.now(zone).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        long used =
                interviewRepository.countByUserIdAndCreatedAtAfterAndStatusNot(
                        userId, monthStart, InterviewStatus.FAILED);
        return (int) Math.max(0, MONTHLY_QUOTA - used);
    }

    @Transactional(readOnly = true)
    public InterviewAvailabilityResponse availability(String userId, UUID topicId) {
        if (!aiClient.configured()) {
            return new InterviewAvailabilityResponse(false, "ai_unavailable", 0);
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

    @Transactional
    public StartInterviewResponse start(String userId, UUID topicId) {
        int left = interviewsLeftThisMonth(userId);
        if (left <= 0) {
            throw new ValidationException("topic_interview_quota_reached");
        }
        if (!aiClient.configured() || !aiClient.voiceAvailable()) {
            throw new AiUnavailableException("topic_interview_voice_unavailable");
        }

        UUID interviewId = UUID.randomUUID();
        Map<String, Object> plan = planner.plan(topicId, userId, interviewId);

        TopicInterview interview =
                TopicInterview.builder()
                        .id(interviewId)
                        .userId(userId)
                        .topicId(topicId)
                        .status(InterviewStatus.CREATED)
                        .plan(plan)
                        .pointsAwarded(0)
                        .build();
        interviewRepository.save(interview);

        Map<String, Object> aiResponse;
        try {
            aiResponse = aiClient.startInterview(plan);
        } catch (Exception e) {
            log.error("Failed to start AI interview session for {}", interviewId, e);
            interview.setStatus(InterviewStatus.FAILED);
            interview.setEndedReason("ai_start_failed");
            interviewRepository.save(interview);
            throw e;
        }

        String url = (String) aiResponse.get("url");
        String token = (String) aiResponse.get("token");
        String room = (String) aiResponse.get("room");

        interview.setRoom(room);
        interviewRepository.save(interview);

        return new StartInterviewResponse(interviewId, url, token);
    }

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
            // Through the template, not this.score(): a self-call skips the @Transactional proxy.
            transactionTemplate.executeWithoutResult(status -> score(interviewId));
        } catch (Exception e) {
            log.error("Asynchronous scoring failed for interview {}", interviewId, e);
        }
    }

    @Transactional
    public void score(UUID interviewId) {
        TopicInterview interview = interviewRepository.findByIdForUpdate(interviewId).orElse(null);
        if (interview == null || interview.getStatus() != InterviewStatus.COMPLETED) {
            return;
        }

        List<TopicInterviewTurn> turns = turnRepository.findByInterviewIdOrderBySeqAsc(interviewId);
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

        Map<String, Object> scorePayload =
                Map.of("tenant", "learnnow", "plan", interview.getPlan(), "turns", turnDtos);

        Map<String, Object> scoreResult;
        try {
            scoreResult = aiClient.scoreInterview(scorePayload);
        } catch (Exception e) {
            log.error("AI client scoring failed for interview {}", interviewId, e);
            interview.setStatus(InterviewStatus.FAILED);
            interview.setEndedReason("scoring_failed");
            interviewRepository.save(interview);
            return;
        }

        Integer overall = (Integer) scoreResult.get("overall");
        Map<String, Object> habits = (Map<String, Object>) scoreResult.get("habits");

        interview.setOverallScore(overall);
        interview.setHabits(habits);

        // Save question feedback
        if (scoreResult.get("questions") instanceof List<?> qList) {
            List<TopicInterviewAnswer> answers = new ArrayList<>();
            for (Object obj : qList) {
                if (obj instanceof Map<?, ?> qMap) {
                    String qIdStr = (String) qMap.get("id");
                    UUID qId = null;
                    UUID subtopicId = null;
                    String prompt = "";
                    try {
                        if (qIdStr != null) {
                            qId = UUID.fromString(qIdStr);
                            InterviewQuestion question =
                                    questionRepository.findById(qId).orElse(null);
                            if (question != null) {
                                subtopicId = question.getSubtopicId();
                                prompt = question.getPrompt();
                            }
                        }
                    } catch (IllegalArgumentException ignored) {
                    }

                    answers.add(
                            TopicInterviewAnswer.builder()
                                    .interviewId(interviewId)
                                    .questionId(qId)
                                    .subtopicId(subtopicId)
                                    .prompt(prompt)
                                    .score((Integer) qMap.get("score"))
                                    .good((String) qMap.get("good"))
                                    .missing((String) qMap.get("missing"))
                                    .evidence((String) qMap.get("evidence"))
                                    .build());
                }
            }
            if (!answers.isEmpty()) {
                answerRepository.saveAll(answers);
            }
        }

        // Award points if this is the first SCORED interview for this topic
        boolean alreadyScored =
                interviewRepository.existsByUserIdAndTopicIdAndStatus(
                        interview.getUserId(), interview.getTopicId(), InterviewStatus.SCORED);
        int pointsToAward = 0;
        if (!alreadyScored) {
            pointsToAward = PointsConfig.TOPIC_INTERVIEW_COMPLETED;
            if (overall != null && overall >= 70) {
                pointsToAward += PointsConfig.TOPIC_INTERVIEW_STRONG_BONUS;
            }
            if (pointsToAward > 0) {
                ZoneId userZone = getUserZone(interview.getUserId());
                activityRecordingService.recordDailyPoints(
                        interview.getUserId(), userZone, pointsToAward);
            }
        }
        interview.setPointsAwarded(pointsToAward);
        interview.setStatus(InterviewStatus.SCORED);
        interviewRepository.save(interview);

        // Save trainer notes from the interview transcript
        try {
            List<Map<String, String>> noteMessages =
                    turns.stream()
                            .map(t -> Map.of("role", t.getRole(), "content", t.getText()))
                            .toList();
            trainerService.saveDistilledNotes(
                    interview.getUserId(), Map.of("messages", noteMessages), "topic_interview");
        } catch (Exception e) {
            log.warn(
                    "Failed to extract trainer notes from interview {}: {}",
                    interviewId,
                    e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public TopicInterviewReportResponse report(String userId, UUID interviewId) {
        TopicInterview interview =
                interviewRepository
                        .findByIdAndUserId(interviewId, userId)
                        .orElseThrow(() -> new NotFoundException("topic_interview_not_found"));

        Topic topic = topicRepository.findById(interview.getTopicId()).orElse(null);
        String topicTitle = topic != null ? topic.getTitle() : "Unknown Topic";

        List<TopicInterviewTurn> turns = turnRepository.findByInterviewIdOrderBySeqAsc(interviewId);
        List<TopicInterviewAnswer> answers = answerRepository.findByInterviewId(interviewId);

        List<TopicInterviewReportResponse.AnswerFeedback> questionDtos =
                answers.stream()
                        .map(
                                a -> {
                                    String modelAnswer = "";
                                    if (a.getQuestionId() != null) {
                                        InterviewQuestion q =
                                                questionRepository
                                                        .findById(a.getQuestionId())
                                                        .orElse(null);
                                        if (q != null) {
                                            modelAnswer =
                                                    q.getAnswerScript() != null
                                                            ? q.getAnswerScript()
                                                            : (q.getAnswerSimple() != null
                                                                    ? q.getAnswerSimple()
                                                                    : q.getAnswerShort());
                                        }
                                    }
                                    return new TopicInterviewReportResponse.AnswerFeedback(
                                            a.getQuestionId(),
                                            a.getSubtopicId(),
                                            a.getPrompt(),
                                            a.getScore(),
                                            a.getGood(),
                                            a.getMissing(),
                                            a.getEvidence(),
                                            modelAnswer);
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
                interview.getTopicId(),
                topicTitle,
                interview.getStatus().name(),
                interview.getOverallScore(),
                interview.getHabits(),
                interview.getPointsAwarded(),
                interview.getCreatedAt(),
                interview.getCompletedAt(),
                questionDtos,
                turnDtos);
    }

    @Transactional(readOnly = true)
    public List<TopicInterviewSummaryResponse> history(String userId) {
        List<TopicInterview> list = interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return list.stream()
                .map(
                        i -> {
                            Topic topic = topicRepository.findById(i.getTopicId()).orElse(null);
                            String topicTitle = topic != null ? topic.getTitle() : "Unknown Topic";
                            return new TopicInterviewSummaryResponse(
                                    i.getId(),
                                    i.getTopicId(),
                                    topicTitle,
                                    i.getStatus().name(),
                                    i.getOverallScore(),
                                    i.getPointsAwarded(),
                                    i.getCreatedAt());
                        })
                .toList();
    }

    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void abandonStaleInterviews() {
        Instant staleThreshold = Instant.now().minus(15, ChronoUnit.MINUTES);
        List<TopicInterview> stale =
                interviewRepository.findByStatusAndCreatedAtBefore(
                        InterviewStatus.CREATED, staleThreshold);
        for (TopicInterview i : stale) {
            i.setStatus(InterviewStatus.ABANDONED);
            i.setEndedReason("abandoned_timeout");
        }
        if (!stale.isEmpty()) {
            interviewRepository.saveAll(stale);
            log.info("Marked {} stale interviews as ABANDONED", stale.size());
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

    private ZoneId getUserZone(String userId) {
        return preferencesRepository
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
    }
}
