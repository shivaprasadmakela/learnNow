package com.learnnow.paths.dto;

import java.util.UUID;

public record TopicSummaryDto(
        UUID id,
        String title,
        String description,
        String category,
        String duration,
        boolean isCompleted) {
    public TopicSummaryDto(
            UUID id, String title, String description, String category, String duration) {
        this(id, title, description, category, duration, false);
    }
}
