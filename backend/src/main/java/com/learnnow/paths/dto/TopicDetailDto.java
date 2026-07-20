package com.learnnow.paths.dto;

import java.util.List;

public record TopicDetailDto(
    Long id,
    String title,
    String description,
    String category,
    String duration,
    boolean isCompleted,
    List<SubtopicDto> subtopics
) {}
