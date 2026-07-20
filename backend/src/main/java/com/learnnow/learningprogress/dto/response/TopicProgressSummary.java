package com.learnnow.learningprogress.dto.response;

public record TopicProgressSummary(
    Long id,
    String title,
    String description,
    String category,
    String duration,
    boolean completed,
    int progressPercentage
) {}
