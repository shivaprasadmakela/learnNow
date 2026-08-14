package com.learnnow.learningprogress.dto.response;

import java.util.List;
import java.util.UUID;

public record PathProgressSummary(
        UUID id,
        String title,
        String description,
        String category,
        String managedBy,
        int progressPercentage,
        int completedTopicsCount,
        int totalTopicsCount,
        List<TopicProgressSummary> topics) {}
