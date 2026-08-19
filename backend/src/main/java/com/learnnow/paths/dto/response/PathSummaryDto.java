package com.learnnow.paths.dto.response;

import java.util.List;
import java.util.UUID;

public record PathSummaryDto(
        UUID id,
        String title,
        String description,
        String category,
        String managedBy,
        int progressPercentage,
        List<TopicSummaryDto> topics) {
    public PathSummaryDto(
            UUID id,
            String title,
            String description,
            String category,
            String managedBy,
            List<TopicSummaryDto> topics) {
        this(id, title, description, category, managedBy, 0, topics);
    }
}
