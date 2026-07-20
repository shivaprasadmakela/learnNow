package com.learnnow.learningprogress.dto.request;

import java.util.UUID;

public record SetTopicCompletionRequest(
    boolean completed,
    UUID eventId
) {}
