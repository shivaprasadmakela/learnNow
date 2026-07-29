package com.learnnow.paths.dto;

import java.util.List;
import java.util.UUID;

public record SubtopicDto(
    UUID id,
    String title,
    String content,
    int orderIndex,
    boolean isCompleted,
    List<QuizQuestionDto> questions
) {
    public record QuizQuestionDto(
        UUID id,
        String kind,
        String prompt,
        List<String> options,
        String correctAnswer,
        String explanation,
        int points
    ) {}
}
