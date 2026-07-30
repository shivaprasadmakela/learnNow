package com.learnnow.notes.api.dto;

import java.time.Instant;
import java.util.UUID;

public record BookmarkResponse(
    UUID id,
    UUID topicId,
    Instant createdAt
) {}
