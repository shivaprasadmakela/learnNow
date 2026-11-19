package com.learnnow.trainer.readiness;

import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository.TopicQuizRecord;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.repository.PathTopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.paths.repository.TopicRepository.TopicHeader;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.InterviewStatus;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Interview readiness per topic: how well the learner would answer questions on it now, from the
 * two pieces of evidence there are - their latest topic-interview score and their quiz accuracy.
 *
 * <p>The interview score weighs more because it is the thing being predicted: explaining a topic
 * out loud. Quiz accuracy is recognition, a weaker signal, and below {@link #MIN_QUIZ_ANSWERS}
 * answers it is noise, so it is ignored. Retries and mock interviews do not count: a retry is one
 * question, and a mock interview is about a role, not a topic.
 */
@Service
@RequiredArgsConstructor
public class ReadinessService {

    /** Below this many answers a topic's quiz accuracy is too noisy to use. */
    public static final int MIN_QUIZ_ANSWERS = 5;

    static final double INTERVIEW_WEIGHT = 0.6;
    static final double QUIZ_WEIGHT = 0.4;
    public static final int WEAK_BELOW = 55;
    static final int OKAY_BELOW = 75;

    private final UserTopicProgressRepository topicProgressRepository;
    private final UserQuizAttemptRepository quizAttemptRepository;
    private final TopicInterviewRepository interviewRepository;
    private final TopicRepository topicRepository;
    private final PathTopicRepository pathTopicRepository;

    /**
     * 0.6 x interview score + 0.4 x quiz accuracy when both exist, else whichever exists, else
     * null. Both inputs are 0-100.
     */
    public static Integer readiness(Integer interviewScore, Integer quizAccuracy) {
        if (interviewScore != null && quizAccuracy != null) {
            return (int) Math.round(INTERVIEW_WEIGHT * interviewScore + QUIZ_WEIGHT * quizAccuracy);
        }
        return interviewScore != null ? interviewScore : quizAccuracy;
    }

    public static String level(Integer readiness) {
        if (readiness == null) return "untested";
        if (readiness < WEAK_BELOW) return "weak";
        if (readiness < OKAY_BELOW) return "okay";
        return "strong";
    }

    /** Quiz accuracy as 0-100, or null when there are too few answers to trust it. */
    public static Integer quizAccuracy(long answered, long correct) {
        if (answered < MIN_QUIZ_ANSWERS) return null;
        return (int) Math.round(100.0 * correct / answered);
    }

    /** Every topic the learner has touched, weakest first; untested topics last. */
    @Transactional(readOnly = true)
    public List<TopicReadiness> forUser(String userId) {
        Map<UUID, UserTopicProgress> progress =
                topicProgressRepository.findByUserId(userId).stream()
                        .collect(
                                Collectors.toMap(
                                        UserTopicProgress::getTopicId,
                                        Function.identity(),
                                        (a, b) -> a));
        Map<UUID, TopicQuizRecord> quiz =
                quizAttemptRepository.quizRecordByTopic(userId).stream()
                        .collect(
                                Collectors.toMap(
                                        TopicQuizRecord::getTopicId,
                                        Function.identity(),
                                        (a, b) -> a));
        // Newest first, so the first one seen for a topic is its latest score.
        Map<UUID, Integer> latestScore = new HashMap<>();
        Map<UUID, Integer> taken = new HashMap<>();
        for (TopicInterview i :
                interviewRepository.findByUserIdAndKindOrderByCreatedAtDesc(
                        userId, InterviewKind.TOPIC)) {
            if (i.getStatus() != InterviewStatus.SCORED || i.getTopicId() == null) continue;
            latestScore.putIfAbsent(i.getTopicId(), i.getOverallScore());
            taken.merge(i.getTopicId(), 1, Integer::sum);
        }

        Set<UUID> topicIds = new LinkedHashSet<>();
        topicIds.addAll(progress.keySet());
        topicIds.addAll(quiz.keySet());
        topicIds.addAll(latestScore.keySet());
        if (topicIds.isEmpty()) {
            return List.of();
        }
        Map<UUID, String> titles =
                topicRepository.findHeadersByIdIn(topicIds).stream()
                        .collect(Collectors.toMap(TopicHeader::getId, TopicHeader::getTitle));
        Map<UUID, UUID> primaryPaths = new HashMap<>();
        List<UUID> withoutProgress =
                topicIds.stream().filter(id -> !progress.containsKey(id)).toList();
        if (!withoutProgress.isEmpty()) {
            pathTopicRepository
                    .findPublishedPathsOfTopics(withoutProgress)
                    .forEach(r -> primaryPaths.putIfAbsent(r.getTopicId(), r.getPathId()));
        }

        List<TopicReadiness> rows = new ArrayList<>();
        for (UUID topicId : topicIds) {
            String title = titles.get(topicId);
            if (title == null) continue;
            UserTopicProgress p = progress.get(topicId);
            TopicQuizRecord q = quiz.get(topicId);
            long answered = q != null ? q.getAttempts() : 0;
            Integer accuracy = q != null ? quizAccuracy(q.getAttempts(), q.getCorrect()) : null;
            Integer interview = latestScore.get(topicId);
            Integer readiness = readiness(interview, accuracy);
            rows.add(
                    new TopicReadiness(
                            topicId,
                            title,
                            p != null ? p.getPathId() : primaryPaths.get(topicId),
                            p != null && p.getStatus() == ProgressStatus.COMPLETED,
                            answered,
                            accuracy,
                            interview,
                            taken.getOrDefault(topicId, 0),
                            readiness,
                            level(readiness)));
        }
        rows.sort(WEAKEST_FIRST);
        return rows;
    }

    static final Comparator<TopicReadiness> WEAKEST_FIRST =
            Comparator.comparing(
                            TopicReadiness::readiness,
                            Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(TopicReadiness::topicTitle, String.CASE_INSENSITIVE_ORDER);
}
