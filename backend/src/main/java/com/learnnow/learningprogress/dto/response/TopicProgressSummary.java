package com.learnnow.learningprogress.dto.response;

import java.util.UUID;

public record TopicProgressSummary(
    UUID id,
    String title,
    String description,
    String category,
    String duration,
    boolean completed,
    int progressPercentage
) {}
