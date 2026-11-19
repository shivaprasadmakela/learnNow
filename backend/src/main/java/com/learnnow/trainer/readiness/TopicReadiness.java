package com.learnnow.trainer.readiness;

import java.util.UUID;

/**
 * How ready a learner is to be interviewed on one topic. {@code quizAccuracy} is null below {@link
 * ReadinessService#MIN_QUIZ_ANSWERS} answers; {@code readiness} is null when there is neither an
 * interview score nor enough quiz answers, and {@code level} is then "untested".
 */
public record TopicReadiness(
        UUID topicId,
        String topicTitle,
        UUID pathId,
        boolean completed,
        long quizAnswered,
        Integer quizAccuracy,
        Integer interviewScore,
        int interviewsTaken,
        Integer readiness,
        String level) {}
