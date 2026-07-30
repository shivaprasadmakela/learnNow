package com.learnnow.notes.api.dto;

import java.time.Instant;
import java.util.UUID;

public record NoteResponse(
    UUID id,
    UUID subtopicId,
    String content,
    Instant createdAt,
    Instant updatedAt
) {}
