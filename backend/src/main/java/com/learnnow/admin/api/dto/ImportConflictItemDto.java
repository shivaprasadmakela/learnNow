package com.learnnow.admin.api.dto;

import java.util.UUID;

public record ImportConflictItemDto(
    String level, // "PATH" | "TOPIC" | "SUBTOPIC"
    String entityName,
    UUID existingId,
    String message
) {}
