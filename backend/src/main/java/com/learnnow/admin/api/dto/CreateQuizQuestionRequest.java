package com.learnnow.admin.api.dto;

public record CreateQuizQuestionRequest(
    String kind,
    String prompt,
    String options,
    String correctAnswer,
    String explanation,
    int points
) {}
