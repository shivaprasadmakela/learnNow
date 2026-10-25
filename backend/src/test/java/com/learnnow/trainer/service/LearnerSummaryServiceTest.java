package com.learnnow.trainer.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.repository.UserQuizAttemptRepository.TopicQuizRecord;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class LearnerSummaryServiceTest {

    private static TopicQuizRecord record(String title, long attempts, long correct) {
        UUID id = UUID.randomUUID();
        return new TopicQuizRecord() {
            public UUID getTopicId() {
                return id;
            }

            public String getTopicTitle() {
                return title;
            }

            public long getAttempts() {
                return attempts;
            }

            public long getCorrect() {
                return correct;
            }
        };
    }

    @Test
    @SuppressWarnings("unchecked")
    void weakTopicsNeedEnoughAnswersAndLowAccuracy() {
        Map<String, Object> quiz =
                LearnerSummaryService.quiz(
                        List.of(
                                record("Transactions", 10, 4),
                                record("HashMap", 3, 0),
                                record("REST", 8, 8)));
        assertThat(quiz.get("answered")).isEqualTo(21L);
        assertThat(quiz.get("overall_accuracy")).isEqualTo("57%");
        List<Map<String, Object>> weak = (List<Map<String, Object>>) quiz.get("weak_topics");
        assertThat(weak).extracting(m -> m.get("topic")).containsExactly("Transactions");
    }

    @Test
    void noQuizAnswersMeansNoAccuracy() {
        assertThat(LearnerSummaryService.quiz(List.of()).get("overall_accuracy")).isNull();
    }

    @Test
    void usualHourIsTheMostCommonLocalStartHour() {
        ZoneId ist = ZoneId.of("Asia/Kolkata");
        List<UserLearningDailyActivity> days =
                List.of(
                        day("2026-10-20T15:40:00Z"), // 21:10 IST
                        day("2026-10-21T15:55:00Z"), // 21:25 IST
                        day("2026-10-22T03:00:00Z")); // 08:30 IST
        assertThat(LearnerSummaryService.usualHour(days, ist)).isEqualTo("21:00");
        assertThat(LearnerSummaryService.usualHour(List.of(), ist)).isNull();
    }

    private static UserLearningDailyActivity day(String firstActivity) {
        UserLearningDailyActivity d = new UserLearningDailyActivity();
        d.setFirstActivityAt(Instant.parse(firstActivity));
        return d;
    }
}
