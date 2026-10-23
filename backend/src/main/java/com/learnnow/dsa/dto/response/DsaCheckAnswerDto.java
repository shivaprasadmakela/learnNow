package com.learnnow.dsa.dto.response;

/**
 * The only place a check's correct answer and explanation are ever revealed.
 *
 * <p>They are revealed on every response, right or wrong, because the first answer is the only one
 * that can score: once it is recorded there is nothing left to farm, so withholding the answer
 * would only make the learner submit again to read it. {@code alreadyAttempted} says this response
 * was graded for feedback and could not have awarded anything.
 */
public record DsaCheckAnswerDto(
        boolean correct,
        String correctAnswer,
        String explanation,
        int pointsAwarded,
        boolean alreadyAttempted) {}
