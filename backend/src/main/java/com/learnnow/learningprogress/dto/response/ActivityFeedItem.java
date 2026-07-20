package com.learnnow.learningprogress.dto.response;

import java.time.Instant;

public record ActivityFeedItem(
    String id,
    String eventType,
    int pointsAwarded,
    Instant occurredAt,
    String pathTitle,
    String topicTitle
) {}
