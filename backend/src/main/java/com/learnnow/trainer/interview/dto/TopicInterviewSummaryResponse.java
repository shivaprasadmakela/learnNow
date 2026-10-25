package com.learnnow.trainer.interview.dto;

import java.time.Instant;
import java.util.UUID;

public record TopicInterviewSummaryResponse(
        UUID id,
        UUID topicId,
        String topicTitle,
        String status,
        Integer overallScore,
        int pointsAwarded,
        Instant createdAt) {}
