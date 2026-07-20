package com.learnnow.paths.dto;

public record TopicSummaryDto(
    Long id,
    String title,
    String description,
    String category,
    String duration,
    boolean isCompleted
) {}
