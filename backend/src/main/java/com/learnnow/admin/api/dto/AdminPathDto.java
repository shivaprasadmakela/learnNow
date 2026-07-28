package com.learnnow.admin.api.dto;

import java.util.List;
import java.util.UUID;

public record AdminPathDto(
    UUID id,
    String title,
    String description,
    String category,
    String managedBy,
    String status,
    List<AdminTopicDto> topics
) {
    public record AdminTopicDto(
        UUID id,
        String title,
        String description,
        String category,
        String duration,
        int orderIndex,
        String status,
        List<AdminSubtopicDto> subtopics
    ) {}

    public record AdminSubtopicDto(
        UUID id,
        String title,
        String content,
        int orderIndex,
        String status
    ) {}
}
