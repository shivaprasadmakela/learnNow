package com.learnnow.dsa.dto.response;

/** The only place a check's correct answer and explanation are ever revealed. */
public record DsaCheckAnswerDto(
        boolean correct, String correctAnswer, String explanation, int pointsAwarded) {}
