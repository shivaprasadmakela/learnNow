package com.learnnow.trainer.interview.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record TopicInterviewReportResponse(
        UUID id,
        UUID topicId,
        String topicTitle,
        String status,
        Integer overallScore,
        Map<String, Object> habits,
        int pointsAwarded,
        Instant createdAt,
        Instant completedAt,
        List<AnswerFeedback> questions,
        List<TurnDto> turns) {

    public record AnswerFeedback(
            UUID questionId,
            UUID subtopicId,
            String prompt,
            Integer score,
            String good,
            String missing,
            String evidence,
            String modelAnswer) {}

    public record TurnDto(
            int seq, String role, String text, BigDecimal atSeconds, UUID questionId) {}
}
