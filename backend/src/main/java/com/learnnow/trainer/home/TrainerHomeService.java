package com.learnnow.trainer.home;

import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.learningprogress.dto.response.DashboardBanner;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.learningprogress.service.NextStepService;
import com.learnnow.paths.dto.response.NextLessonDto;
import com.learnnow.trainer.dto.GoalResponse;
import com.learnnow.trainer.entity.LearnerGoal;
import com.learnnow.trainer.feature.AiFeature;
import com.learnnow.trainer.feature.AiFeatureService;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.interview.service.TopicInterviewService;
import com.learnnow.trainer.plan.service.WeeklyPlanService;
import com.learnnow.trainer.readiness.ReadinessService;
import com.learnnow.trainer.readiness.TopicReadiness;
import com.learnnow.trainer.repository.LearnerGoalRepository;
import com.learnnow.trainer.resume.entity.LearnerResume;
import com.learnnow.trainer.resume.repository.LearnerResumeRepository;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.LearnerSummaryService;
import com.learnnow.trainer.service.TrainerQuotaService;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The trainer home: feature switches, goal, streak, today's tasks, nudges, readiness, quotas,
 * resume and recent interviews, read in one go for the trainer page and the dashboard card.
 *
 * <p>The nudge rules themselves live in {@link NudgeRules}; this only gathers their input.
 */
@Service
@RequiredArgsConstructor
public class TrainerHomeService {

    /** A topic finished this recently, with no interview yet, earns an interview nudge. */
    static final int INTERVIEW_READY_DAYS = 14;

    private static final int READINESS_ROWS = 3;

    private final AiClient aiClient;
    private final AiFeatureService featureService;
    private final LearnerSummaryService summaryService;
    private final ReadinessService readinessService;
    private final WeeklyPlanService planService;
    private final TrainerQuotaService quotaService;
    private final TopicInterviewService interviewService;
    private final NextStepService nextStepService;
    private final LearnerGoalRepository goalRepository;
    private final LearnerResumeRepository resumeRepository;
    private final TopicInterviewRepository interviewRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final InterviewQuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public TrainerHomeResponse home(String userId) {
        boolean available = aiClient.configured();
        boolean personalised = summaryService.personalised(userId);
        TrainerHomeResponse.Features features =
                new TrainerHomeResponse.Features(
                        available && featureService.enabled(AiFeature.ASK_AI),
                        available && featureService.enabled(AiFeature.TOPIC_INTERVIEW),
                        available && featureService.enabled(AiFeature.MOCK_INTERVIEW),
                        available && featureService.enabled(AiFeature.RESUME),
                        available && featureService.enabled(AiFeature.WEEKLY_PLAN));

        ZoneId zone = quotaService.zone(userId);
        LocalDate today = LocalDate.now(zone);
        UserLearningPreferences prefs =
                preferencesRepository
                        .findByUserId(userId)
                        .orElseGet(() -> UserLearningPreferences.builder().userId(userId).build());
        boolean studiedToday = today.equals(prefs.getLastActivityDate());
        TrainerHomeResponse.Streak streak =
                new TrainerHomeResponse.Streak(prefs.getCurrentStreakForDate(today), studiedToday);

        Optional<LearnerGoal> goal = goalRepository.findById(userId);
        Optional<LearnerResume> resume = resumeRepository.findPresent(userId);

        List<Map<String, Object>> todayTasks = List.of();
        List<NudgeRules.Nudge> nudges = List.of();
        TrainerHomeResponse.Readiness readiness =
                new TrainerHomeResponse.Readiness(List.of(), List.of());
        if (personalised) {
            List<TopicReadiness> rows = readinessService.forUser(userId);
            readiness = readinessSummary(rows);
            if (features.weeklyPlan()) {
                todayTasks = planService.todayTasks(userId);
            }
            Long daysSince =
                    prefs.getLastActivityDate() == null
                            ? null
                            : ChronoUnit.DAYS.between(prefs.getLastActivityDate(), today);
            nudges =
                    NudgeRules.decide(
                            new NudgeRules.Input(
                                    today,
                                    ZonedDateTime.now(zone).getHour(),
                                    streak.currentDays(),
                                    studiedToday,
                                    daysSince,
                                    nextLesson(userId),
                                    interviewReady(userId, rows),
                                    weakest(rows),
                                    quizMistakes(rows),
                                    goal.isPresent(),
                                    goal.map(LearnerGoal::getTargetDate).orElse(null),
                                    resume.isPresent(),
                                    features.askAi(),
                                    features.topicInterview(),
                                    features.resume()));
        }

        TrainerHomeResponse.Quotas quotas =
                new TrainerHomeResponse.Quotas(
                        quotaService.topicInterviewsLeft(userId),
                        quotaService.mockInterviewsLeft(userId),
                        quotaService.resumeAnalysesLeft(userId),
                        quotaService.retriesLeftToday(userId),
                        quotaService.planRefreshesLeft(userId));

        TrainerHomeResponse.ResumeSummary resumeSummary =
                resume.map(
                                r ->
                                        new TrainerHomeResponse.ResumeSummary(
                                                true, overall(r), r.getTargetRole()))
                        .orElse(new TrainerHomeResponse.ResumeSummary(false, null, null));

        return new TrainerHomeResponse(
                available,
                personalised,
                features,
                goal.map(GoalResponse::from).orElse(null),
                streak,
                todayTasks,
                nudges,
                readiness,
                quotas,
                resumeSummary,
                interviewService.summaries(
                        interviewRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId)));
    }

    /** Every touched topic, weakest first; empty without the PERSONALISATION consent. */
    @Transactional(readOnly = true)
    public List<TopicReadiness> readiness(String userId) {
        return summaryService.personalised(userId) ? readinessService.forUser(userId) : List.of();
    }

    static TrainerHomeResponse.Readiness readinessSummary(List<TopicReadiness> rows) {
        List<TopicReadiness> weakest =
                rows.stream().filter(r -> r.readiness() != null).limit(READINESS_ROWS).toList();
        // Completed topics first: those are the ones an interview can test now.
        List<TopicReadiness> untested =
                rows.stream()
                        .filter(r -> r.readiness() == null)
                        .sorted(Comparator.comparing((TopicReadiness r) -> !r.completed()))
                        .limit(READINESS_ROWS)
                        .toList();
        return new TrainerHomeResponse.Readiness(weakest, untested);
    }

    private NudgeRules.NextLesson nextLesson(String userId) {
        DashboardBanner banner = nextStepService.forUser(userId);
        NextLessonDto l = banner.nextLesson();
        return l == null
                ? null
                : new NudgeRules.NextLesson(
                        l.pathId(), l.topicId(), l.subtopicId(), l.topicTitle(), l.subtopicTitle());
    }

    /** The most recently completed topic that has bank questions and no scored interview. */
    private NudgeRules.TopicRef interviewReady(String userId, List<TopicReadiness> rows) {
        Instant since = Instant.now().minus(INTERVIEW_READY_DAYS, ChronoUnit.DAYS);
        Map<UUID, TopicReadiness> byTopic =
                rows.stream()
                        .collect(
                                Collectors.toMap(
                                        TopicReadiness::topicId, Function.identity(), (a, b) -> a));
        List<UserTopicProgress> recent =
                topicProgressRepository.findByUserId(userId).stream()
                        .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                        .filter(
                                p ->
                                        p.getCompletedAt() != null
                                                && p.getCompletedAt().isAfter(since))
                        .filter(
                                p ->
                                        byTopic.containsKey(p.getTopicId())
                                                && byTopic.get(p.getTopicId()).interviewsTaken()
                                                        == 0)
                        .sorted(
                                Comparator.comparing(
                                        UserTopicProgress::getCompletedAt,
                                        Comparator.reverseOrder()))
                        .toList();
        if (recent.isEmpty()) {
            return null;
        }
        Set<UUID> withQuestions =
                questionRepository.findTopicsWithPublishedOpeners().stream()
                        .map(InterviewQuestionRepository.TopicRow::getId)
                        .collect(Collectors.toSet());
        return recent.stream()
                .filter(p -> withQuestions.contains(p.getTopicId()))
                .findFirst()
                .map(
                        p ->
                                new NudgeRules.TopicRef(
                                        p.getTopicId(),
                                        byTopic.get(p.getTopicId()).topicTitle(),
                                        null))
                .orElse(null);
    }

    static NudgeRules.TopicRef weakest(List<TopicReadiness> rows) {
        return rows.stream()
                .filter(r -> r.readiness() != null)
                .min(Comparator.comparingInt(TopicReadiness::readiness))
                .map(r -> new NudgeRules.TopicRef(r.topicId(), r.topicTitle(), r.readiness()))
                .orElse(null);
    }

    static NudgeRules.TopicRef quizMistakes(List<TopicReadiness> rows) {
        return rows.stream()
                .filter(
                        r ->
                                r.quizAccuracy() != null
                                        && r.quizAnswered() >= ReadinessService.MIN_QUIZ_ANSWERS)
                .min(Comparator.comparingInt(TopicReadiness::quizAccuracy))
                .map(r -> new NudgeRules.TopicRef(r.topicId(), r.topicTitle(), r.quizAccuracy()))
                .orElse(null);
    }

    private static Integer overall(LearnerResume r) {
        return r.getReview() != null && r.getReview().get("overall") instanceof Number n
                ? n.intValue()
                : null;
    }
}
