package com.learnnow.trainer.plan.service;

import com.learnnow.common.exception.ValidationException;
import com.learnnow.learningprogress.dto.response.DashboardBanner;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.learningprogress.service.NextStepService;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.trainer.feature.AiFeature;
import com.learnnow.trainer.feature.AiFeatureService;
import com.learnnow.trainer.plan.dto.WeeklyPlanResponse;
import com.learnnow.trainer.plan.entity.TrainerWeeklyPlan;
import com.learnnow.trainer.plan.repository.TrainerWeeklyPlanRepository;
import com.learnnow.trainer.readiness.ReadinessService;
import com.learnnow.trainer.readiness.TopicReadiness;
import com.learnnow.trainer.repository.LearnerGoalRepository;
import com.learnnow.trainer.service.AiClient;
import com.learnnow.trainer.service.LearnerSummaryService;
import com.learnnow.trainer.service.TrainerQuotaService;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * The trainer's weekly study plan. learnnow-ai writes it from the learner summary, the lessons that
 * come next on their path and their readiness per topic, and may only name topics it was sent, so
 * every task points at something real.
 *
 * <p>The plan is personal advice drawn from the learner's records, so it needs the PERSONALISATION
 * consent. Writing one takes several seconds; no transaction is held across it.
 */
@Service
public class WeeklyPlanService {

    static final int NEXT_LESSONS = 8;
    private static final int READINESS_ROWS = 30;
    private static final int MAX_KNOWN_TOPICS = 400;

    private final TrainerWeeklyPlanRepository planRepository;
    private final LearnerSummaryService summaryService;
    private final ReadinessService readinessService;
    private final NextStepService nextStepService;
    private final TopicRepository topicRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final LearnerGoalRepository goalRepository;
    private final AiClient aiClient;
    private final AiFeatureService featureService;
    private final TrainerQuotaService quotaService;
    private final TransactionTemplate tx;
    private final TransactionTemplate readOnly;

    public WeeklyPlanService(
            TrainerWeeklyPlanRepository planRepository,
            LearnerSummaryService summaryService,
            ReadinessService readinessService,
            NextStepService nextStepService,
            TopicRepository topicRepository,
            UserSubtopicProgressRepository subtopicProgressRepository,
            UserTopicProgressRepository topicProgressRepository,
            LearnerGoalRepository goalRepository,
            AiClient aiClient,
            AiFeatureService featureService,
            TrainerQuotaService quotaService,
            PlatformTransactionManager transactionManager) {
        this.planRepository = planRepository;
        this.summaryService = summaryService;
        this.readinessService = readinessService;
        this.nextStepService = nextStepService;
        this.topicRepository = topicRepository;
        this.subtopicProgressRepository = subtopicProgressRepository;
        this.topicProgressRepository = topicProgressRepository;
        this.goalRepository = goalRepository;
        this.aiClient = aiClient;
        this.featureService = featureService;
        this.quotaService = quotaService;
        this.tx = new TransactionTemplate(transactionManager);
        this.readOnly = new TransactionTemplate(transactionManager);
        this.readOnly.setReadOnly(true);
    }

    /** This week's plan, if one has been written. */
    public Optional<WeeklyPlanResponse> current(String userId) {
        LocalDate weekStart = TrainerQuotaService.weekStart(quotaService.zone(userId));
        return planRepository
                .findByUserIdAndWeekStart(userId, weekStart)
                .map(p -> response(p, quotaService.planRefreshesLeft(userId)));
    }

    /** Writes this week's plan, or writes it again; at most the weekly limit of times. */
    public WeeklyPlanResponse generate(String userId) {
        featureService.requireEnabled(AiFeature.WEEKLY_PLAN);
        if (!summaryService.personalised(userId)) {
            throw new ValidationException("trainer_personalisation_off");
        }
        if (quotaService.planRefreshesLeft(userId) <= 0) {
            throw new ValidationException("trainer_plan_refresh_limit");
        }
        ZoneId zone = quotaService.zone(userId);
        LocalDate today = LocalDate.now(zone);
        LocalDate weekStart = TrainerQuotaService.weekStart(today);

        Map<String, Object> body = readOnly.execute(status -> requestBody(userId, today));
        Map<String, Object> plan = aiClient.weeklyPlan(body);

        TrainerWeeklyPlan saved =
                tx.execute(
                        status -> {
                            Instant now = Instant.now();
                            TrainerWeeklyPlan row =
                                    planRepository
                                            .findByUserIdAndWeekStart(userId, weekStart)
                                            .map(
                                                    existing -> {
                                                        existing.setGenerations(
                                                                existing.getGenerations() + 1);
                                                        return existing;
                                                    })
                                            .orElseGet(
                                                    () ->
                                                            TrainerWeeklyPlan.builder()
                                                                    .id(UUID.randomUUID())
                                                                    .userId(userId)
                                                                    .weekStart(weekStart)
                                                                    .createdAt(now)
                                                                    .build());
                            row.setPlan(plan);
                            row.setUpdatedAt(now);
                            return planRepository.save(row);
                        });
        return response(saved, quotaService.planRefreshesLeft(userId));
    }

    /** Today's tasks from this week's stored plan; empty when there is none. */
    public List<Map<String, Object>> todayTasks(String userId) {
        ZoneId zone = quotaService.zone(userId);
        LocalDate today = LocalDate.now(zone);
        return planRepository
                .findByUserIdAndWeekStart(userId, TrainerQuotaService.weekStart(today))
                .map(p -> tasksFor(p.getPlan(), today.getDayOfWeek()))
                .orElse(List.of());
    }

    /** The tasks a plan gives one day ("Mon".."Sun"), as {kind, title, topic, minutes}. */
    static List<Map<String, Object>> tasksFor(Map<String, Object> plan, DayOfWeek day) {
        String name = day.getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
        if (plan == null || !(plan.get("days") instanceof List<?> days)) {
            return List.of();
        }
        for (Object d : days) {
            if (d instanceof Map<?, ?> entry
                    && name.equalsIgnoreCase(String.valueOf(entry.get("day")))
                    && entry.get("tasks") instanceof List<?> tasks) {
                List<Map<String, Object>> out = new ArrayList<>();
                for (Object t : tasks) {
                    if (t instanceof Map<?, ?> task) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("kind", task.get("kind"));
                        m.put("title", task.get("title"));
                        m.put("topic", task.get("topic"));
                        m.put("minutes", task.get("minutes"));
                        out.add(m);
                    }
                }
                return out;
            }
        }
        return List.of();
    }

    private Map<String, Object> requestBody(String userId, LocalDate today) {
        Map<String, Object> learner = new LinkedHashMap<>(summaryService.summarise(userId));
        List<Map<String, Object>> nextLessons = nextLessons(userId);
        List<TopicReadiness> readiness = readinessService.forUser(userId);
        learner.put("next_lessons", nextLessons);
        learner.put(
                "readiness",
                readiness.stream()
                        .limit(READINESS_ROWS)
                        .map(
                                r -> {
                                    Map<String, Object> m = new LinkedHashMap<>();
                                    m.put("topic", r.topicTitle());
                                    m.put("completed", r.completed());
                                    m.put("quiz_accuracy", r.quizAccuracy());
                                    m.put("interview_score", r.interviewScore());
                                    m.put("readiness", r.readiness());
                                    m.put("level", r.level());
                                    return m;
                                })
                        .toList());

        // learnnow-ai drops any task naming a topic it was not sent.
        Set<String> known = new LinkedHashSet<>();
        nextLessons.forEach(l -> known.add((String) l.get("topic")));
        readiness.forEach(r -> known.add(r.topicTitle()));
        if (learner.get("topics") instanceof Map<?, ?> topics) {
            addTitles(known, topics.get("completed"));
            if (topics.get("recent") instanceof List<?> recent) {
                recent.forEach(
                        r -> addTitles(known, r instanceof Map<?, ?> m ? m.get("topic") : null));
            }
        }
        known.remove(null);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("platform", "learnNow");
        body.put("learner", learner);
        body.put("today", today.toString());
        body.put("known_topics", known.stream().limit(MAX_KNOWN_TOPICS).toList());
        goalRepository
                .findById(userId)
                .map(g -> g.getHoursPerWeek())
                .ifPresent(h -> body.put("hours_per_week", h.intValue()));
        return body;
    }

    /**
     * The next unfinished lessons, in teaching order, on the path the dashboard's next-step card
     * points at: what "continue" means this week.
     */
    private List<Map<String, Object>> nextLessons(String userId) {
        DashboardBanner banner = nextStepService.forUser(userId);
        if (banner.pathId() == null) {
            return List.of();
        }
        List<Object[]> lessons = topicRepository.findPublishedLessonsInOrder(banner.pathId());
        if (lessons.isEmpty()) {
            return List.of();
        }
        Set<UUID> doneLessons =
                new HashSet<>(
                        subtopicProgressRepository.findCompletedSubtopicIds(
                                userId, lessons.stream().map(r -> (UUID) r[2]).toList()));
        Set<UUID> doneTopics =
                new HashSet<>(
                        topicProgressRepository.findCompletedTopicIds(
                                userId,
                                lessons.stream().map(r -> (UUID) r[0]).distinct().toList()));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : lessons) {
            if (out.size() >= NEXT_LESSONS) break;
            if (doneTopics.contains((UUID) row[0]) || doneLessons.contains((UUID) row[2])) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("path", banner.pathTitle());
            m.put("topic", row[1]);
            m.put("lesson", row[3]);
            out.add(m);
        }
        return out;
    }

    private static void addTitles(Set<String> known, Object value) {
        if (value instanceof String s) {
            known.add(s);
        } else if (value instanceof List<?> list) {
            list.forEach(v -> addTitles(known, v));
        }
    }

    private static WeeklyPlanResponse response(TrainerWeeklyPlan plan, int refreshesLeft) {
        return new WeeklyPlanResponse(
                plan.getWeekStart(), plan.getUpdatedAt(), refreshesLeft, plan.getPlan());
    }
}
