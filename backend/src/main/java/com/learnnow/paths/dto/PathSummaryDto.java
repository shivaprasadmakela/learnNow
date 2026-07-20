package com.learnnow.paths.dto;

import java.util.List;

public record PathSummaryDto(
    Long id,
    String title,
    String description,
    String category,
    String managedBy,
    List<TopicSummaryDto> topics
) {}
