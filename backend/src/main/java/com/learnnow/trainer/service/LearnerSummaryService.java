package com.learnnow.trainer.service;

import com.learnnow.learningprogress.dto.response.DashboardBanner;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository.TopicQuizRecord;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.learningprogress.service.NextStepService;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.PathRepository.PathTitle;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.paths.repository.TopicRepository.TopicHeader;
import com.learnnow.privacy.entity.ConsentPurpose;
import com.learnnow.privacy.service.ConsentService;
import com.learnnow.trainer.entity.TrainerNote;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.entity.TopicInterviewAnswer;
import com.learnnow.trainer.interview.repository.TopicInterviewAnswerRepository;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.trainer.repository.LearnerGoalRepository;
import com.learnnow.trainer.repository.TrainerNoteRepository;
import com.learnnow.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Everything the AI trainer knows about one learner, assembled fresh for each conversation.
 *
 * <p>The trainer has no memory of its own. Before every reply this reads the learner's real records
 * - progress, quiz results, streak, study times, goal - so its facts are never stale and never
 * invented, plus the short notes it wrote earlier. The result is a plain map that goes to the AI
 * service as JSON, a few thousand tokens at most.
 *
 * <p>Personal data in it is governed by the PERSONALISATION consent. A learner who has withdrawn it
 * still gets answers, but the summary says only that and carries none of their records.
 */
@Service
@RequiredArgsConstructor
public class LearnerSummaryService {

    /** Below this many answers a topic's quiz accuracy is too noisy to call weak or strong. */
    static final int MIN_QUIZ_ANSWERS = 5;

    static final double WEAK_ACCURACY = 0.6;
    private static final int RECENT_TOPICS = 8;
    private static final int ACTIVITY_DAYS = 30;
    private static final int NOTES = 30;

    private final ConsentService consentService;
    private final UserRepository userRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserQuizAttemptRepository quizAttemptRepository;
    private final TopicRepository topicRepository;
    private final PathRepository pathRepository;
    private final NextStepService nextStepService;
    private final LearnerGoalRepository goalRepository;
    private final TrainerNoteRepository noteRepository;
    private final TopicInterviewRepository interviewRepository;
    private final TopicInterviewAnswerRepository interviewAnswerRepository;

    public boolean personalised(String userId) {
        return consentService.hasConsent(userId, ConsentPurpose.PERSONALISATION);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> summarise(String userId) {
        if (!personalised(userId)) {
            return Map.of(
                    "personalisation",
                    "off: the learner has withdrawn consent to personalisation, so nothing about"
                            + " their progress is shared. Answer generally, and if they ask for a"
                            + " personal plan, explain that turning personalisation back on in"
                            + " Privacy settings lets you use their progress.");
        }

        UserLearningPreferences prefs =
                preferencesRepository
                        .findByUserId(userId)
                        .orElseGet(() -> UserLearningPreferences.builder().userId(userId).build());
        ZoneId zone = ZoneId.of(prefs.getTimezone());
        LocalDate today = LocalDate.now(zone);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put(
                "first_name",
                userRepository.findById(userId).map(u -> u.getFirstName()).orElse(null));
        summary.put("today", today.toString());
        summary.put("goal", goal(userId, today));
        summary.put(
                "streak",
                Map.of(
                        "current_days", prefs.getCurrentStreakForDate(today),
                        "longest_days", prefs.getLongestStreak(),
                        "studied_today", today.equals(prefs.getLastActivityDate())));
        summary.put("total_points", prefs.getTotalPoints());
        summary.put("study_pattern", studyPattern(userId, zone, today));
        summary.put("topics", topics(userId));
        summary.put("next_step", nextStep(userId));
        summary.put("quiz", quiz(userId));
        summary.put("interviews", interviews(userId));
        summary.put("trainer_notes", notes(userId));
        summary.put("resume", null);
        return summary;
    }

    private Map<String, Object> goal(String userId, LocalDate today) {
        return goalRepository
                .findById(userId)
                .map(
                        g -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("target_role", g.getTargetRole());
                            m.put("target_date", g.getTargetDate());
                            if (g.getTargetDate() != null) {
                                m.put(
                                        "days_left",
                                        java.time.temporal.ChronoUnit.DAYS.between(
                                                today, g.getTargetDate()));
                            }
                            m.put("hours_per_week", g.getHoursPerWeek());
                            return m;
                        })
                .orElse(null);
    }

    /** How often, and at what local hour, the learner usually starts studying. */
    private Map<String, Object> studyPattern(String userId, ZoneId zone, LocalDate today) {
        LocalDate since = today.minusDays(ACTIVITY_DAYS);
        List<UserLearningDailyActivity> days =
                dailyActivityRepository.findByUserIdOrderByActivityDateDesc(userId).stream()
                        .filter(d -> d.getActivityDate().isAfter(since))
                        .filter(d -> d.getQualifyingEventCount() > 0)
                        .toList();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("active_days_last_30", days.size());
        m.put("usual_start_hour", usualHour(days, zone));
        return m;
    }

    static String usualHour(List<UserLearningDailyActivity> days, ZoneId zone) {
        Map<Integer, Long> byHour =
                days.stream()
                        .filter(d -> d.getFirstActivityAt() != null)
                        .collect(
                                Collectors.groupingBy(
                                        d -> d.getFirstActivityAt().atZone(zone).getHour(),
                                        Collectors.counting()));
        return byHour.entrySet().stream()
                .max(
                        Map.Entry.<Integer, Long>comparingByValue()
                                .thenComparing(Map.Entry.comparingByKey()))
                .map(e -> String.format("%02d:00", e.getKey()))
                .orElse(null);
    }

    private Map<String, Object> topics(String userId) {
        List<UserTopicProgress> all = topicProgressRepository.findByUserId(userId);
        List<UserTopicProgress> recent =
                topicProgressRepository.findRecentByUserId(userId, Limit.of(RECENT_TOPICS));
        Set<UUID> topicIds = new HashSet<>();
        all.forEach(p -> topicIds.add(p.getTopicId()));
        Map<UUID, String> titles =
                topicRepository.findHeadersByIdIn(topicIds).stream()
                        .collect(Collectors.toMap(TopicHeader::getId, TopicHeader::getTitle));
        Set<UUID> pathIds =
                recent.stream().map(UserTopicProgress::getPathId).collect(Collectors.toSet());
        Map<UUID, String> paths =
                pathRepository.findTitlesByIdInAndStatus(pathIds, ContentStatus.PUBLISHED).stream()
                        .collect(Collectors.toMap(PathTitle::getId, PathTitle::getTitle));

        Map<String, Object> m = new LinkedHashMap<>();
        m.put(
                "completed",
                all.stream()
                        .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                        .sorted(
                                Comparator.comparing(
                                        UserTopicProgress::getCompletedAt,
                                        Comparator.nullsLast(Comparator.reverseOrder())))
                        .map(p -> titles.get(p.getTopicId()))
                        .filter(Objects::nonNull)
                        .toList());
        m.put(
                "recent",
                recent.stream()
                        .map(
                                p -> {
                                    Map<String, Object> r = new LinkedHashMap<>();
                                    r.put("topic", titles.get(p.getTopicId()));
                                    r.put("path", paths.get(p.getPathId()));
                                    r.put("status", p.getStatus().name().toLowerCase());
                                    return r;
                                })
                        .filter(r -> r.get("topic") != null)
                        .toList());
        return m;
    }

    private Map<String, Object> nextStep(String userId) {
        DashboardBanner banner = nextStepService.forUser(userId);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kind", banner.type().toLowerCase());
        m.put("path", banner.pathTitle());
        if (banner.nextLesson() != null) {
            m.put("topic", banner.nextLesson().topicTitle());
            m.put("lesson", banner.nextLesson().subtopicTitle());
        }
        m.put("reason", banner.reason());
        return m;
    }

    static Map<String, Object> quiz(List<TopicQuizRecord> records) {
        long answered = records.stream().mapToLong(TopicQuizRecord::getAttempts).sum();
        long correct = records.stream().mapToLong(TopicQuizRecord::getCorrect).sum();
        Function<TopicQuizRecord, Map<String, Object>> row =
                r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("topic", r.getTopicTitle());
                    m.put("answered", r.getAttempts());
                    m.put("accuracy", percent(r.getCorrect(), r.getAttempts()));
                    return m;
                };
        List<TopicQuizRecord> enough =
                records.stream().filter(r -> r.getAttempts() >= MIN_QUIZ_ANSWERS).toList();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("answered", answered);
        m.put("overall_accuracy", answered == 0 ? null : percent(correct, answered));
        m.put(
                "weak_topics",
                enough.stream()
                        .filter(r -> (double) r.getCorrect() / r.getAttempts() < WEAK_ACCURACY)
                        .sorted(
                                Comparator.comparingDouble(
                                        r -> (double) r.getCorrect() / r.getAttempts()))
                        .map(row)
                        .toList());
        m.put(
                "by_topic",
                records.stream()
                        .sorted(Comparator.comparingLong(TopicQuizRecord::getAttempts).reversed())
                        .limit(12)
                        .map(row)
                        .toList());
        return m;
    }

    private Map<String, Object> quiz(String userId) {
        return quiz(quizAttemptRepository.quizRecordByTopic(userId));
    }

    private List<Map<String, Object>> interviews(String userId) {
        List<TopicInterview> scored =
                interviewRepository.findTop5ByUserIdAndStatusOrderByCreatedAtDesc(
                        userId, InterviewStatus.SCORED);
        if (scored.isEmpty()) {
            return List.of();
        }
        Set<UUID> topicIds =
                scored.stream().map(TopicInterview::getTopicId).collect(Collectors.toSet());
        Map<UUID, String> titles =
                topicRepository.findHeadersByIdIn(topicIds).stream()
                        .collect(Collectors.toMap(TopicHeader::getId, TopicHeader::getTitle));

        List<UUID> interviewIds = scored.stream().map(TopicInterview::getId).toList();
        Map<UUID, List<TopicInterviewAnswer>> answersByInterview =
                interviewAnswerRepository.findByInterviewIdIn(interviewIds).stream()
                        .collect(Collectors.groupingBy(TopicInterviewAnswer::getInterviewId));

        return scored.stream()
                .map(
                        i -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("topic", titles.get(i.getTopicId()));
                            m.put(
                                    "date",
                                    i.getCreatedAt() != null
                                            ? i.getCreatedAt().toString().substring(0, 10)
                                            : null);
                            m.put("overall", i.getOverallScore());
                            List<TopicInterviewAnswer> ans =
                                    answersByInterview.getOrDefault(i.getId(), List.of());
                            String weakest =
                                    ans.stream()
                                            .filter(a -> a.getScore() != null)
                                            .min(
                                                    Comparator.comparingInt(
                                                            TopicInterviewAnswer::getScore))
                                            .map(TopicInterviewAnswer::getPrompt)
                                            .orElse(null);
                            m.put("weakest_question", weakest);
                            return m;
                        })
                .toList();
    }

    private List<Map<String, Object>> notes(String userId) {
        return noteRepository.findByUserIdOrderByCreatedAtDesc(userId, Limit.of(NOTES)).stream()
                .map(
                        (TrainerNote n) -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("kind", n.getKind());
                            m.put("text", n.getText());
                            m.put("date", n.getCreatedAt().toString().substring(0, 10));
                            return m;
                        })
                .toList();
    }

    private static String percent(long part, long whole) {
        return Math.round(100.0 * part / whole) + "%";
    }
}
