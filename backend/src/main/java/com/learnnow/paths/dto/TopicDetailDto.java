package com.learnnow.paths.dto;

import java.util.List;
import java.util.UUID;

public record TopicDetailDto(
        UUID id,
        String title,
        String description,
        String category,
        String duration,
        boolean isCompleted,
        int progressPercentage,
        List<SubtopicDto> subtopics) {}
