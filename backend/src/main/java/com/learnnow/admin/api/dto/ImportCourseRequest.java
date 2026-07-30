package com.learnnow.admin.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

/**
 * Import request for bulk course creation or topic append.
 * - pathId == null  → CREATE mode: title and description are required
 * - pathId != null  → APPEND mode: topics are appended to the existing path
 * - conflictStrategy: "FAIL_ON_CONFLICT" | "OVERWRITE" | "SKIP_EXISTING" | "KEEP_BOTH"
 */
public record ImportCourseRequest(
    UUID pathId,
    String title,
    String description,
    String category,
    String managedBy,
    String conflictStrategy,
    @NotEmpty @Valid List<ImportTopicRequest> topics
) {
    public record ImportTopicRequest(
        String title,
        String description,
        String category,
        String duration,
        @NotEmpty @Valid List<ImportSubtopicRequest> subtopics
    ) {}

    public record ImportSubtopicRequest(
        String title,
        String content,
        @Valid List<ImportQuestionRequest> questions
    ) {}

    public record ImportQuestionRequest(
        String kind,
        String prompt,
        List<String> options,
        String correctAnswer,
        String explanation,
        int points
    ) {}
}
