package com.learnnow.paths.dto;

import java.util.List;
import java.util.UUID;

public record AdminTopicRequest(
    UUID id,
    String title,
    String description,
    String category,
    String duration,
    String status,
    List<AdminSubtopicRequest> subtopics
) {}
