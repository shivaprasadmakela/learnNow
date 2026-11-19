package com.learnnow.trainer.service;

import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.plan.repository.TrainerWeeklyPlanRepository;
import com.learnnow.trainer.resume.repository.LearnerResumeRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * How much of each paid AI feature a learner has left. Every period is the learner's own: a month
 * or a day starts at midnight in their time zone, and a week on their Monday.
 *
 * <p>Each quota counts only its own kind of interview, so a mock interview or a retry never uses up
 * the topic-interview quota. FAILED interviews never count: the learner got nothing from them.
 */
@Service
public class TrainerQuotaService {

    private final TopicInterviewRepository interviewRepository;
    private final LearnerResumeRepository resumeRepository;
    private final TrainerWeeklyPlanRepository planRepository;
    private final UserLearningPreferencesRepository preferencesRepository;

    private final int topicInterviews;
    private final int mockInterviews;
    private final int resumeAnalyses;
    private final int retriesPerDay;
    private final int planRefreshesPerWeek;

    public TrainerQuotaService(
            TopicInterviewRepository interviewRepository,
            LearnerResumeRepository resumeRepository,
            TrainerWeeklyPlanRepository planRepository,
            UserLearningPreferencesRepository preferencesRepository,
            @Value("${learnnow.ai.quota.topic-interviews:5}") int topicInterviews,
            @Value("${learnnow.ai.quota.mock-interviews:2}") int mockInterviews,
            @Value("${learnnow.ai.quota.resume-analyses:3}") int resumeAnalyses,
            @Value("${learnnow.ai.quota.retries-per-day:5}") int retriesPerDay,
            @Value("${learnnow.ai.quota.plan-refreshes-per-week:3}") int planRefreshesPerWeek) {
        this.interviewRepository = interviewRepository;
        this.resumeRepository = resumeRepository;
        this.planRepository = planRepository;
        this.preferencesRepository = preferencesRepository;
        this.topicInterviews = topicInterviews;
        this.mockInterviews = mockInterviews;
        this.resumeAnalyses = resumeAnalyses;
        this.retriesPerDay = retriesPerDay;
        this.planRefreshesPerWeek = planRefreshesPerWeek;
    }

    public record Limits(
            int topicInterviews,
            int mockInterviews,
            int resumeAnalyses,
            int retriesPerDay,
            int planRefreshesPerWeek) {}

    public Limits limits() {
        return new Limits(
                topicInterviews,
                mockInterviews,
                resumeAnalyses,
                retriesPerDay,
                planRefreshesPerWeek);
    }

    public int topicInterviewsLeft(String userId) {
        return left(
                topicInterviews,
                used(userId, List.of(InterviewKind.TOPIC), monthStart(zone(userId))));
    }

    public int mockInterviewsLeft(String userId) {
        return left(
                mockInterviews, used(userId, InterviewKind.mockKinds(), monthStart(zone(userId))));
    }

    public int retriesLeftToday(String userId) {
        ZoneId zone = zone(userId);
        Instant dayStart = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        return left(retriesPerDay, used(userId, List.of(InterviewKind.RETRY), dayStart));
    }

    public int resumeAnalysesLeft(String userId) {
        String month = monthKey(zone(userId));
        int used =
                resumeRepository
                        .findById(userId)
                        .filter(r -> month.equals(r.getAnalysisMonth()))
                        .map(r -> r.getAnalysisCount())
                        .orElse(0);
        return left(resumeAnalyses, used);
    }

    public int planRefreshesLeft(String userId) {
        int used =
                planRepository
                        .findByUserIdAndWeekStart(userId, weekStart(zone(userId)))
                        .map(p -> p.getGenerations())
                        .orElse(0);
        return left(planRefreshesPerWeek, used);
    }

    /** The learner's time zone; UTC when they have none or it is not a zone Java knows. */
    public ZoneId zone(String userId) {
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

    /** "YYYY-MM" of the learner's current month. */
    public static String monthKey(ZoneId zone) {
        return YearMonth.now(zone).toString();
    }

    /** The Monday of the learner's current week. */
    public static LocalDate weekStart(ZoneId zone) {
        return weekStart(LocalDate.now(zone));
    }

    public static LocalDate weekStart(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private static Instant monthStart(ZoneId zone) {
        return LocalDate.now(zone).withDayOfMonth(1).atStartOfDay(zone).toInstant();
    }

    private long used(String userId, List<InterviewKind> kinds, Instant since) {
        return interviewRepository.countByUserIdAndKindInAndCreatedAtAfterAndStatusNot(
                userId, kinds, since, InterviewStatus.FAILED);
    }

    private static int left(int limit, long used) {
        return (int) Math.max(0, limit - used);
    }
}
