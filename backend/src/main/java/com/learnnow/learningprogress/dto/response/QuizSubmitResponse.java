package com.learnnow.learningprogress.dto.response;

import java.util.UUID;

/**
 * @param correctAnswer withheld until the attempt is settled. Returning it alongside a wrong answer
 *     handed the caller the answer, which they could then resubmit for points.
 * @param alreadyAttempted true when this question was answered before, so no points were awarded
 */
public record QuizSubmitResponse(
        UUID questionId,
        boolean isCorrect,
        String correctAnswer,
        String explanation,
        int pointsEarned,
        boolean alreadyAttempted) {}
