package com.learnnow.admin.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
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
        List<AdminTopicDto> topics) {
    public record AdminTopicDto(
            UUID id,
            String title,
            String description,
            String category,
            String duration,
            int orderIndex,
            String status,
            List<AdminSubtopicDto> subtopics) {}

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
            List<AdminQuizQuestionDto> questions) {}

    public record AdminCodeSnippetDto(
            String id,
            String language,
            String label,
            String code,
            String expectedOutput,
            Boolean runnable,
            Boolean editable,
            Integer orderIndex) {}

    /**
     * Accepts the same legacy field names as {@code ImportQuestionRequest}. Course JSON in the wild
     * carries {@code question}/{@code answer} as well as {@code prompt}/{@code correctAnswer}, and
     * this record is what the save-and-publish flow binds to. Without the aliases the legacy names
     * bound to nothing, so prompt arrived null and the whole batch failed on the not-null
     * constraint on quiz_questions.prompt.
     */
    public record AdminQuizQuestionDto(
            UUID id,
            @JsonAlias({"kind", "type"}) String kind,
            @JsonAlias({"prompt", "question", "questionText"}) String prompt,
            @JsonAlias({"options", "choices"}) List<String> options,
            @JsonAlias({"correctAnswer", "answer", "correct"}) String correctAnswer,
            String explanation,
            int points) {}
}
