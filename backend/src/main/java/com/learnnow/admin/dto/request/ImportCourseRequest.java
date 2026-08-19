package com.learnnow.admin.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

/**
 * Import request for bulk course creation or topic append. - pathId == null → CREATE mode: title
 * and description are required - pathId != null → APPEND mode: topics are appended to the existing
 * path - conflictStrategy: "FAIL_ON_CONFLICT" | "OVERWRITE" | "SKIP_EXISTING" | "KEEP_BOTH"
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ImportCourseRequest(
        UUID pathId,
        String title,
        String description,
        String category,
        String managedBy,
        String conflictStrategy,
        @NotEmpty @Valid List<ImportTopicRequest> topics) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportTopicRequest(
            String title,
            String description,
            String category,
            String duration,
            @NotEmpty @Valid List<ImportSubtopicRequest> subtopics) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportSubtopicRequest(
            String title,
            String content,
            String level,
            String track,
            List<String> prerequisites,
            String videoUrl,
            Integer estimatedMinutes,
            @Valid List<ImportCodeSnippetRequest> codeSnippets,
            @Valid List<ImportQuestionRequest> questions) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportCodeSnippetRequest(
            String id,
            String language,
            String label,
            String code,
            String expectedOutput,
            Boolean runnable,
            Boolean editable,
            Integer orderIndex) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportQuestionRequest(
            @JsonAlias({"kind", "type"}) String kind,
            @JsonAlias({"prompt", "question", "questionText"}) String prompt,
            @JsonAlias({"options", "choices"}) List<String> options,
            @JsonAlias({"correctAnswer", "answer", "correct"}) String correctAnswer,
            String explanation,
            int points) {}
}
