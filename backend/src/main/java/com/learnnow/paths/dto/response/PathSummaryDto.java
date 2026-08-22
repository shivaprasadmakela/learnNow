package com.learnnow.paths.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * A path in a list response.
 *
 * <p>{@code topics} carries only the first page of the path's topics - the rest arrive from {@code
 * GET /api/paths/{pathId}/topics} as the user scrolls. {@code topicCount} is the full count, so the
 * UI can still show "N topics" and know whether more remain, and {@code progressPercentage} is
 * always computed across every topic rather than the embedded slice.
 */
public record PathSummaryDto(
        UUID id,
        String title,
        String description,
        String category,
        String managedBy,
        int progressPercentage,
        int topicCount,
        List<TopicSummaryDto> topics) {

    public PathSummaryDto(
            UUID id,
            String title,
            String description,
            String category,
            String managedBy,
            int progressPercentage,
            List<TopicSummaryDto> topics) {
        this(
                id,
                title,
                description,
                category,
                managedBy,
                progressPercentage,
                topics == null ? 0 : topics.size(),
                topics);
    }

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
