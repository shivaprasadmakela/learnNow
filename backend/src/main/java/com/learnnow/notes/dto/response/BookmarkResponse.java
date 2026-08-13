package com.learnnow.notes.dto.response;

import java.time.Instant;
import java.util.UUID;

public record BookmarkResponse(
    UUID id,
    UUID topicId,
    Instant createdAt
) {}
