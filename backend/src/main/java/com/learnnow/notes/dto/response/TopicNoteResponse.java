package com.learnnow.notes.dto.response;

import java.time.Instant;
import java.util.UUID;

public record TopicNoteResponse(
        UUID id, UUID topicId, String content, Instant createdAt, Instant updatedAt) {}
