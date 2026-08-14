package com.learnnow.paths.dto.response;

import java.util.List;
import java.util.UUID;

public record SubtopicDto(
        UUID id,
        String title,
        String content,
        int orderIndex,
        boolean isCompleted,
        String level,
        String track,
        List<String> prerequisites,
        String videoUrl,
        int estimatedMinutes,
        List<CodeSnippetDto> codeSnippets,
        List<QuizQuestionDto> questions) {
    public record CodeSnippetDto(
            String id,
            String language,
            String label,
            String code,
            String expectedOutput,
            boolean runnable,
            boolean editable,
            int orderIndex) {}

    public record QuizQuestionDto(
            UUID id,
            String kind,
            String prompt,
            List<String> options,
            String correctAnswer,
            String explanation,
            int points) {}
}
