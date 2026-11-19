package com.learnnow.trainer.interview.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * One row of the learner's interview history. {@code topicId}/{@code topicTitle} are null for mock
 * interviews.
 */
public record TopicInterviewSummaryResponse(
        UUID id,
        String kind,
        String title,
        UUID topicId,
        String topicTitle,
        String status,
        Integer overallScore,
        int pointsAwarded,
        Instant createdAt) {}
