package com.learnnow.admin.dto.response;

import java.util.UUID;

public record ImportConflictItemDto(
    String level, // "PATH" | "TOPIC" | "SUBTOPIC"
    String entityName,
    UUID existingId,
    String message
) {}
