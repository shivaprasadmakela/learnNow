package com.learnnow.learningprogress.dto.response;

import java.util.List;

public record PathProgressSummary(
    Long id,
    String title,
    String description,
    String category,
    String managedBy,
    int progressPercentage,
    int completedTopicsCount,
    int totalTopicsCount,
    List<TopicProgressSummary> topics
) {}
