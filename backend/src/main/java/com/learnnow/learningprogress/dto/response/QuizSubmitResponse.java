package com.learnnow.learningprogress.dto.response;

import java.util.UUID;

public record QuizSubmitResponse(
        UUID questionId,
        boolean isCorrect,
        String correctAnswer,
        String explanation,
        int pointsEarned) {}
