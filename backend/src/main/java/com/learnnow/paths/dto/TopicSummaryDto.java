package com.learnnow.paths.dto;

import java.util.UUID;

public record TopicSummaryDto(
    UUID id,
    String title,
    String description,
    String category,
    String duration,
    boolean isCompleted
) {}
