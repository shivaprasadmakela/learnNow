package com.learnnow.interview.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * One question and the follow-ups it leads to.
 *
 * <p>An opening question carries the subtopic that teaches its answer, so a learner who cannot
 * answer it can go and revise; follow-ups leave those null, as they share their opener's.
 *
 * <p>{@code practice} is true when no sighting has been recorded: the question is good preparation
 * but nobody has yet reported being asked it, and the learner is told so rather than shown a
 * provenance it does not have.
 */
public record InterviewQuestionDto(
        UUID id,
        UUID topicId,
        UUID subtopicId,
        String subtopicTitle,
        String prompt,
        Answer answer,
        String answerShort,
        String answerDeep,
        String answerSignal,
        int depth,
        boolean practice,
        List<Sighting> sightings,
        List<InterviewQuestionDto> followUps) {

    /**
     * The beginner answer, in the order a learner reads it; null for a question not yet rewritten,
     * which carries the earlier three-part answer instead. Sections are Markdown.
     */
    public record Answer(
            String simple,
            String how,
            String usage,
            String example,
            String script,
            String remember,
            String caution) {}

    /**
     * Where and when it was reported as asked. There is no field for the source link, and there
     * should never be one: it is for admins to verify a report, not for learners.
     */
    public record Sighting(
            String company, String role, String level, String round, LocalDate seenMonth) {}
}
