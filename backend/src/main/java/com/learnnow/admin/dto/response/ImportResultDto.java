package com.learnnow.admin.dto.response;

import java.util.UUID;

public record ImportResultDto(
    UUID pathId,
    String pathTitle,
    int topicsCreated,
    int subtopicsCreated,
    int questionsCreated,
    String status,
    String mode  // "CREATED" | "APPENDED"
) {}
