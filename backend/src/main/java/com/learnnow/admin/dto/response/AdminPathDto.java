package com.learnnow.admin.dto.response;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public record AdminPathDto(
    UUID id,
    @NotBlank(message = "Title is required") String title,
    String description,
    String category,
    String managedBy,
    String status,
    List<AdminTopicDto> topics
) {
    public record AdminTopicDto(
        UUID id,
        String title,
        String description,
        String category,
        String duration,
        int orderIndex,
        String status,
        List<AdminSubtopicDto> subtopics
    ) {}

    public record AdminSubtopicDto(
        UUID id,
        String title,
        String content,
        int orderIndex,
        String status,
        String level,
        String track,
        List<String> prerequisites,
        String videoUrl,
        Integer estimatedMinutes,
        List<AdminCodeSnippetDto> codeSnippets,
        List<AdminQuizQuestionDto> questions
    ) {}

    public record AdminCodeSnippetDto(
        String id,
        String language,
        String label,
        String code,
        String expectedOutput,
        Boolean runnable,
        Boolean editable,
        Integer orderIndex
    ) {}

    public record AdminQuizQuestionDto(
        UUID id,
        String kind,
        String prompt,
        List<String> options,
        String correctAnswer,
        String explanation,
        int points
    ) {}
}
