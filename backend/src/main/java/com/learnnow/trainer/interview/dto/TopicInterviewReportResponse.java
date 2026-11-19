package com.learnnow.trainer.interview.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * An interview's report. {@code feedback} (dimensions, strengths, improvements, next_step) is null
 * for interviews scored before it existed; {@code parentInterviewId} is set on a retry.
 */
public record TopicInterviewReportResponse(
        UUID id,
        String kind,
        String title,
        UUID topicId,
        String topicTitle,
        String status,
        Integer overallScore,
        Map<String, Object> habits,
        Map<String, Object> feedback,
        int pointsAwarded,
        Integer learnerRating,
        UUID parentInterviewId,
        Instant createdAt,
        Instant completedAt,
        List<AnswerFeedback> questions,
        List<TurnDto> turns) {

    /**
     * One question's evaluation. {@code questionId} and {@code subtopicId} are set only for bank
     * questions; {@code planQuestionId} always, and is what a retry names.
     */
    public record AnswerFeedback(
            UUID planQuestionId,
            UUID questionId,
            UUID subtopicId,
            UUID topicId,
            String category,
            String prompt,
            Integer score,
            String good,
            String missing,
            String evidence,
            String modelAnswer) {}

    public record TurnDto(
            int seq, String role, String text, BigDecimal atSeconds, UUID questionId) {}
}
