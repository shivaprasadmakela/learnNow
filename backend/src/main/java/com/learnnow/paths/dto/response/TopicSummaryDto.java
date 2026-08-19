package com.learnnow.paths.dto.response;

import java.util.UUID;

public record TopicSummaryDto(
        UUID id,
        String title,
        String description,
        String category,
        String duration,
        boolean isCompleted,
        int progressPercentage) {
    public TopicSummaryDto(
            UUID id, String title, String description, String category, String duration) {
        this(id, title, description, category, duration, false, 0);
    }

    public TopicSummaryDto(
            UUID id, String title, String description, String category, String duration, boolean isCompleted) {
        this(id, title, description, category, duration, isCompleted, isCompleted ? 100 : 0);
    }
}
