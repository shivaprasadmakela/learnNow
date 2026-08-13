package com.learnnow.admin.dto.request;

public record CreateQuizQuestionRequest(
    String kind,
    String prompt,
    String options,
    String correctAnswer,
    String explanation,
    int points
) {}
