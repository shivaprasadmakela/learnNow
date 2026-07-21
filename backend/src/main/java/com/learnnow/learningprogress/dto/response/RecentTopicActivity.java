package com.learnnow.learningprogress.dto.response;

import java.time.Instant;

public record RecentTopicActivity(
    Long topicId,
    String topicTitle,
    Long pathId,
    String pathTitle,
    int progressPercentage,
    boolean completed,
    Instant lastActivityAt
) {}
