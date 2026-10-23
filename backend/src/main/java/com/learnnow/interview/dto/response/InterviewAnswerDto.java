package com.learnnow.interview.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * What revealing a question shows: its answer, and the follow-up questions the answer earns - as
 * prompts only, each answered in turn when it is revealed.
 *
 * <p>{@code answer} is the beginner answer; it is null for a question not yet rewritten, which
 * carries the earlier three-part answer in {@code answerShort}, {@code answerDeep} and {@code
 * answerSignal} instead.
 */
public record InterviewAnswerDto(
        UUID questionId,
        Answer answer,
        String answerShort,
        String answerDeep,
        String answerSignal,
        List<InterviewQuestionDto> followUps) {

    /** The beginner answer, in the order a learner reads it. Sections are Markdown. */
    public record Answer(
            String simple,
            String how,
            String usage,
            String example,
            String script,
            String remember,
            String caution) {}
}
