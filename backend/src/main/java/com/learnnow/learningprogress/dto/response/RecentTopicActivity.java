package com.learnnow.learningprogress.dto.response;

import java.time.Instant;
import java.util.UUID;

public record RecentTopicActivity(
    UUID topicId,
    String topicTitle,
    UUID pathId,
    String pathTitle,
    int progressPercentage,
    boolean completed,
    Instant lastActivityAt
) {}
